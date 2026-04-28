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
    "morning-summary-8am": {
        "task": "app.workers.tasks.send_morning_summaries",
        "schedule": crontab(hour=8, minute=0),
    },
    "daily-report-9pm": {
        "task": "app.workers.tasks.send_daily_reports",
        "schedule": crontab(hour=21, minute=0),
    },
    "generate-daily-tasks": {
        "task": "app.workers.tasks.generate_daily_tasks_for_all",
        "schedule": crontab(hour=0, minute=5),
    },
}
