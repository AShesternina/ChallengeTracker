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
        from app.services.report_service import streak_report

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

                # Deduplicate: skip if already sent in last 30 min
                # (allows re-send if user changed their preferred time today)
                thirty_min_ago = now_utc - timedelta(minutes=30)
                already = (await db.execute(
                    select(NotificationLog).where(
                        and_(
                            NotificationLog.user_id == user.id,
                            NotificationLog.type == NotificationType.morning_summary,
                            NotificationLog.status == NotificationStatus.sent,
                            NotificationLog.created_at >= thirty_min_ago,
                        )
                    )
                )).scalars().first()
                if already:
                    continue

                today_local = user_now.date()
                summary = await get_daily_tasks(db, user.id, today_local)
                if summary.total > 0:
                    streak_data = await streak_report(db, user.id, user.streak_protection)
                    await send_morning_summary(db, user, summary.total, streak=streak_data.current_streak)
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

                # On Sundays, weekly_review replaces the daily report
                if user_now.weekday() == 6:
                    continue

                pref = user.notification_evening_time or "21:00"

                if not _is_within_window(user_now.strftime("%H:%M"), pref):
                    continue

                # Deduplicate: skip if already sent in last 30 min
                thirty_min_ago = now_utc - timedelta(minutes=30)
                already = (await db.execute(
                    select(NotificationLog).where(
                        and_(
                            NotificationLog.user_id == user.id,
                            NotificationLog.type == NotificationType.daily_report,
                            NotificationLog.status == NotificationStatus.sent,
                            NotificationLog.created_at >= thirty_min_ago,
                        )
                    )
                )).scalars().first()
                if already:
                    continue

                today_local = user_now.date()
                stats = await daily_report(db, user.id, today_local)
                if stats.total > 0:
                    await send_daily_report(db, user, stats.completed, stats.total)
                    await db.commit()

    _run(_inner())


@celery_app.task(name="app.workers.tasks.send_weekly_reviews", bind=True, max_retries=3)
def send_weekly_reviews(self):
    async def _inner():
        import pytz
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.models.notification_log import NotificationLog, NotificationType, NotificationStatus
        from app.services.report_service import weekly_review_data
        from app.services.notification_service import send_weekly_review

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

                # Only on Sundays in user's local timezone
                if user_now.weekday() != 6:
                    continue

                pref = user.notification_evening_time or "21:00"
                if not _is_within_window(user_now.strftime("%H:%M"), pref):
                    continue

                # Deduplicate: skip if already sent in last 30 min
                thirty_min_ago = now_utc - timedelta(minutes=30)
                already = (await db.execute(
                    select(NotificationLog).where(
                        and_(
                            NotificationLog.user_id == user.id,
                            NotificationLog.type == NotificationType.weekly_review,
                            NotificationLog.status == NotificationStatus.sent,
                            NotificationLog.created_at >= thirty_min_ago,
                        )
                    )
                )).scalars().first()
                if already:
                    continue

                today_local = user_now.date()
                data = await weekly_review_data(db, user.id, today_local)
                if data:
                    await send_weekly_review(
                        db, user,
                        completed=data["week_completed"],
                        total=data["week_total"],
                        rate=data["week_rate"],
                        trend_arrow=data["trend_arrow"],
                        trend=data["trend"],
                        trend_delta=data["trend_delta"],
                        best=data["best_challenge"],
                    )
                    await db.commit()

    _run(_inner())


@celery_app.task(name="app.workers.tasks.send_task_reminders", bind=True, max_retries=3)
def send_task_reminders(self):
    async def _inner():
        import pytz
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.models.daily_task_instance import DailyTaskInstance, TaskStatus
        from app.models.challenge_instance import ChallengeInstance, InstanceStatus
        from app.models.challenge import Challenge
        from app.models.notification_log import NotificationLog, NotificationType, NotificationStatus
        from app.services.notification_service import send_task_reminder

        now_utc = datetime.now(dt_timezone.utc)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.is_active == True, User.notify_task_reminders == True)
            )
            users = list(result.scalars().all())

            for user in users:
                try:
                    user_tz = pytz.timezone(user.timezone)
                except Exception:
                    user_tz = pytz.UTC

                user_now = now_utc.astimezone(user_tz)
                today_local = user_now.date()
                current_minutes = user_now.hour * 60 + user_now.minute

                # Dedup: skip if task_reminder already sent in last 4 min
                four_min_ago = now_utc - timedelta(minutes=4)
                already = (await db.execute(
                    select(NotificationLog).where(
                        and_(
                            NotificationLog.user_id == user.id,
                            NotificationLog.type == NotificationType.task_reminder,
                            NotificationLog.status == NotificationStatus.sent,
                            NotificationLog.created_at >= four_min_ago,
                        )
                    )
                )).scalars().first()
                if already:
                    continue

                # Get pending timed tasks for today from active challenges
                rows = (await db.execute(
                    select(DailyTaskInstance, Challenge.title.label("ctitle"))
                    .join(ChallengeInstance, DailyTaskInstance.challenge_instance_id == ChallengeInstance.id)
                    .join(Challenge, ChallengeInstance.challenge_id == Challenge.id)
                    .where(
                        and_(
                            DailyTaskInstance.user_id == user.id,
                            DailyTaskInstance.date == today_local,
                            DailyTaskInstance.status == TaskStatus.pending,
                            DailyTaskInstance.scheduled_time.isnot(None),
                            ChallengeInstance.status == InstanceStatus.active,
                        )
                    )
                )).all()

                # Filter by ±2 min window in user's local time
                due_names = []
                for task, title in rows:
                    t = task.scheduled_time
                    t_min = t.hour * 60 + t.minute
                    if abs(t_min - current_minutes) <= 2:
                        due_names.append(title)

                if not due_names:
                    continue

                # Deduplicate challenge names (multi-tasks can share a title)
                unique_names = list(dict.fromkeys(due_names))
                await send_task_reminder(db, user, unique_names)
                await db.commit()

    _run(_inner())


@celery_app.task(name="app.workers.tasks.send_burnout_alerts", bind=True, max_retries=3)
def send_burnout_alerts(self):
    async def _inner():
        import pytz
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.models.notification_log import NotificationLog, NotificationType, NotificationStatus
        from app.services.report_service import check_burnout
        from app.services.notification_service import send_burnout_alert

        now_utc = datetime.now(dt_timezone.utc)
        five_days_ago = now_utc - timedelta(days=5)

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.is_active == True))
            users = list(result.scalars().all())

            for user in users:
                try:
                    user_tz = pytz.timezone(user.timezone)
                except Exception:
                    user_tz = pytz.UTC

                today_local = now_utc.astimezone(user_tz).date()

                # Dedup: skip if burnout alert already sent in last 5 days
                already = (await db.execute(
                    select(NotificationLog).where(
                        and_(
                            NotificationLog.user_id == user.id,
                            NotificationLog.type == NotificationType.burnout_alert,
                            NotificationLog.status == NotificationStatus.sent,
                            NotificationLog.created_at >= five_days_ago,
                        )
                    )
                )).scalars().first()
                if already:
                    continue

                if await check_burnout(db, user.id, today_local):
                    await send_burnout_alert(db, user)
                    await db.commit()

    _run(_inner())


@celery_app.task(name="app.workers.tasks.send_email_daily_reports", bind=True, max_retries=3)
def send_email_daily_reports(self):
    async def _inner():
        import pytz
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.core.redis import get_redis
        from app.models.user import User
        from app.services.report_service import daily_report, streak_report, daily_challenges_breakdown
        from app.services.email_service import send_daily_report_email

        now_utc = datetime.now(dt_timezone.utc)
        redis = get_redis()

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(
                    and_(User.is_active == True, User.is_verified == True, User.notify_email_daily == True)
                )
            )
            users = list(result.scalars().all())

            for user in users:
                try:
                    user_tz = pytz.timezone(user.timezone)
                except Exception:
                    user_tz = pytz.UTC

                user_now = now_utc.astimezone(user_tz)

                # Daily email replaces weekly on Sundays (weekly handles it)
                if user_now.weekday() == 6:
                    continue

                pref = user.notification_evening_time or "21:00"
                if not _is_within_window(user_now.strftime("%H:%M"), pref):
                    continue

                # Dedup via Redis: one daily email per user per calendar day
                today_local = user_now.date()
                dedup_key = f"email_daily:{user.id}:{today_local.isoformat()}"
                if not await redis.set(dedup_key, 1, ex=23 * 3600, nx=True):
                    continue

                stats = await daily_report(db, user.id, today_local)
                if stats.total > 0:
                    streak_data = await streak_report(db, user.id, user.streak_protection)
                    challenges = await daily_challenges_breakdown(db, user.id, today_local)
                    rate = round(stats.completed / stats.total * 100) if stats.total else 0
                    await send_daily_report_email(
                        user, stats.completed, stats.total, rate, streak_data.current_streak, challenges
                    )

    _run(_inner())


@celery_app.task(name="app.workers.tasks.send_email_weekly_reports", bind=True, max_retries=3)
def send_email_weekly_reports(self):
    async def _inner():
        import pytz
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.core.redis import get_redis
        from app.models.user import User
        from app.services.report_service import weekly_review_data, streak_report, weekly_challenges_breakdown
        from app.services.email_service import send_weekly_report_email

        now_utc = datetime.now(dt_timezone.utc)
        redis = get_redis()

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(
                    and_(User.is_active == True, User.is_verified == True, User.notify_email_weekly == True)
                )
            )
            users = list(result.scalars().all())

            for user in users:
                try:
                    user_tz = pytz.timezone(user.timezone)
                except Exception:
                    user_tz = pytz.UTC

                user_now = now_utc.astimezone(user_tz)

                # Weekly email only on Sundays in user's local timezone
                if user_now.weekday() != 6:
                    continue

                pref = user.notification_evening_time or "21:00"
                if not _is_within_window(user_now.strftime("%H:%M"), pref):
                    continue

                # Dedup via Redis: one weekly email per user per week (keyed by Monday's date)
                monday = (user_now.date() - timedelta(days=6))
                dedup_key = f"email_weekly:{user.id}:{monday.isoformat()}"
                if not await redis.set(dedup_key, 1, ex=6 * 24 * 3600, nx=True):
                    continue

                today_local = user_now.date()
                data = await weekly_review_data(db, user.id, today_local)
                if data:
                    streak_data = await streak_report(db, user.id, user.streak_protection)
                    challenges = await weekly_challenges_breakdown(db, user.id, today_local)
                    await send_weekly_report_email(
                        user,
                        completed=data["week_completed"],
                        total=data["week_total"],
                        rate=data["week_rate"],
                        trend_arrow=data["trend_arrow"],
                        trend_delta=data["trend_delta"],
                        best=data["best_challenge"],
                        streak=streak_data.current_streak,
                        challenges=challenges,
                    )

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
