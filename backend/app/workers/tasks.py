"""Celery tasks running in worker process (sync wrappers around async services)."""

import asyncio
from datetime import date, datetime, timedelta
from datetime import timezone as dt_timezone

from app.workers.celery_app import celery_app


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


def _is_within_window(current: str, target: str, minutes: int = 4) -> bool:
    """Return True if current HH:MM is within ±minutes of target HH:MM."""
    cur_h, cur_m = map(int, current.split(":"))
    tgt_h, tgt_m = map(int, target.split(":"))
    return abs(cur_h * 60 + cur_m - (tgt_h * 60 + tgt_m)) <= minutes


@celery_app.task(name="app.workers.tasks.send_morning_summaries", bind=True, max_retries=3)
def send_morning_summaries(self):
    async def _inner():
        import pytz
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.models.notification_log import NotificationLog, NotificationType, NotificationStatus
        from app.services.daily_task_service import get_daily_tasks
        from app.services.notification_service import send_morning_summary

        now_utc = datetime.now(dt_timezone.utc)

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.is_active == True))
            users = list(result.scalars().all())

            for user in users:
                try:
                    user_tz = pytz.timezone(user.timezone)
                except Exception:
                    user_tz = pytz.UTC

                user_now = now_utc.astimezone(user_tz)
                pref = user.notification_morning_time or "08:00"

                if not _is_within_window(user_now.strftime("%H:%M"), pref):
                    continue

                # Deduplicate: skip if already sent today in user's local date
                today_local = user_now.date()
                day_start = user_tz.localize(
                    datetime.combine(today_local, datetime.min.time())
                ).astimezone(dt_timezone.utc)
                day_end = day_start + timedelta(days=1)

                already = (await db.execute(
                    select(NotificationLog).where(
                        and_(
                            NotificationLog.user_id == user.id,
                            NotificationLog.type == NotificationType.morning_summary,
                            NotificationLog.status == NotificationStatus.sent,
                            NotificationLog.created_at >= day_start,
                            NotificationLog.created_at < day_end,
                        )
                    )
                )).scalar_one_or_none()
                if already:
                    continue

                summary = await get_daily_tasks(db, user.id, today_local)
                if summary.total > 0:
                    await send_morning_summary(db, user, summary.total)
                    await db.commit()

    _run(_inner())


@celery_app.task(name="app.workers.tasks.send_daily_reports", bind=True, max_retries=3)
def send_daily_reports(self):
    async def _inner():
        import pytz
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.models.notification_log import NotificationLog, NotificationType, NotificationStatus
        from app.services.report_service import daily_report
        from app.services.notification_service import send_daily_report

        now_utc = datetime.now(dt_timezone.utc)

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.is_active == True))
            users = list(result.scalars().all())

            for user in users:
                try:
                    user_tz = pytz.timezone(user.timezone)
                except Exception:
                    user_tz = pytz.UTC

                user_now = now_utc.astimezone(user_tz)
                pref = user.notification_evening_time or "21:00"

                if not _is_within_window(user_now.strftime("%H:%M"), pref):
                    continue

                today_local = user_now.date()
                day_start = user_tz.localize(
                    datetime.combine(today_local, datetime.min.time())
                ).astimezone(dt_timezone.utc)
                day_end = day_start + timedelta(days=1)

                already = (await db.execute(
                    select(NotificationLog).where(
                        and_(
                            NotificationLog.user_id == user.id,
                            NotificationLog.type == NotificationType.daily_report,
                            NotificationLog.status == NotificationStatus.sent,
                            NotificationLog.created_at >= day_start,
                            NotificationLog.created_at < day_end,
                        )
                    )
                )).scalar_one_or_none()
                if already:
                    continue

                stats = await daily_report(db, user.id, today_local)
                if stats.total > 0:
                    await send_daily_report(db, user, stats.completed, stats.total)
                    await db.commit()

    _run(_inner())


@celery_app.task(name="app.workers.tasks.complete_expired_challenges", bind=True, max_retries=3)
def complete_expired_challenges_task(self):
    async def _inner():
        from app.core.database import AsyncSessionLocal
        from app.services.challenge_service import complete_expired_challenges

        async with AsyncSessionLocal() as db:
            count = await complete_expired_challenges(db)
            await db.commit()
            return count

    _run(_inner())


@celery_app.task(name="app.workers.tasks.generate_daily_tasks_for_all", bind=True, max_retries=3)
def generate_daily_tasks_for_all(self):
    async def _inner():
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.services.daily_task_service import ensure_daily_tasks

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.is_active == True))
            users = list(result.scalars().all())
            today = date.today()
            for user in users:
                await ensure_daily_tasks(db, user.id, today)
                await db.commit()

    _run(_inner())
