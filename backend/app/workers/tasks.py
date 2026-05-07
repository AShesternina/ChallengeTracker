"""Celery tasks running in worker process (sync wrappers around async services)."""

import asyncio
from datetime import date

from app.workers.celery_app import celery_app


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(name="app.workers.tasks.send_morning_summaries", bind=True, max_retries=3)
def send_morning_summaries(self):
    async def _inner():
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.services.daily_task_service import get_daily_tasks
        from app.services.notification_service import send_morning_summary

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.is_active == True))
            users = list(result.scalars().all())
            today = date.today()
            for user in users:
                summary = await get_daily_tasks(db, user.id, today)
                if summary.total > 0:
                    await send_morning_summary(db, user, summary.total)
                    await db.commit()

    _run(_inner())


@celery_app.task(name="app.workers.tasks.send_daily_reports", bind=True, max_retries=3)
def send_daily_reports(self):
    async def _inner():
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.services.report_service import daily_report
        from app.services.notification_service import send_daily_report

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.is_active == True))
            users = list(result.scalars().all())
            today = date.today()
            for user in users:
                stats = await daily_report(db, user.id, today)
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
