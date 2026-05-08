from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "challengetracker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    # Runs every 5 min — each task checks per-user preferred local time
    "morning-summary": {
        "task": "app.workers.tasks.send_morning_summaries",
        "schedule": crontab(minute="*/5"),
    },
    "daily-report": {
        "task": "app.workers.tasks.send_daily_reports",
        "schedule": crontab(minute="*/5"),
    },
    "task-reminders": {
        "task": "app.workers.tasks.send_task_reminders",
        "schedule": crontab(minute="*/5"),
    },
    "weekly-review": {
        "task": "app.workers.tasks.send_weekly_reviews",
        "schedule": crontab(minute="*/5"),
    },
    "generate-daily-tasks": {
        "task": "app.workers.tasks.generate_daily_tasks_for_all",
        "schedule": crontab(hour=0, minute=5),
    },
    "complete-expired-challenges": {
        "task": "app.workers.tasks.complete_expired_challenges",
        "schedule": crontab(hour=0, minute=10),
    },
}
