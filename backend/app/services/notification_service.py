"""Notification dispatcher.

Push (Variant B): sends data-only payload — Service Worker translates it.
Email (fallback): uses notifications_i18n.py for translated text.
"""

import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_log import NotificationChannel, NotificationLog, NotificationStatus, NotificationType
from app.models.user import User
from app.models.user_device import UserDevice
from app.services.email_service import email_adapter
from app.services.push_service import send_push
from app.services.notifications_i18n import get_morning_summary, get_daily_report, get_weekly_review, get_burnout_alert

logger = logging.getLogger(__name__)


async def _get_user_devices(db: AsyncSession, user_id: int) -> list[UserDevice]:
    result = await db.execute(select(UserDevice).where(UserDevice.user_id == user_id))
    return list(result.scalars().all())


async def _log(
    db: AsyncSession,
    user_id: int,
    ntype: NotificationType,
    channel: NotificationChannel,
    status: NotificationStatus,
    payload: dict | None = None,
    error: str | None = None,
) -> None:
    log = NotificationLog(
        user_id=user_id,
        type=ntype,
        channel=channel,
        status=status,
        payload=json.dumps(payload) if payload else None,
        error=error,
    )
    db.add(log)
    await db.flush()


async def dispatch(
    db: AsyncSession,
    user: User,
    ntype: NotificationType,
    push_data: dict,
    email_title: str,
    email_body: str,
) -> None:
    """Send notification: push (all devices) + telegram if connected, email as fallback."""
    any_sent = False

    # Push — send to all registered devices
    devices = await _get_user_devices(db, user.id)
    for device in devices:
        try:
            await send_push(device.push_subscription, push_data)
            await _log(db, user.id, ntype, NotificationChannel.push, NotificationStatus.sent, push_data)
            any_sent = True
        except Exception as e:
            await _log(db, user.id, ntype, NotificationChannel.push, NotificationStatus.failed, push_data, str(e))

    # Telegram — if account is linked
    if user.telegram_chat_id:
        try:
            from app.services.telegram_service import send_telegram
            text = f"<b>{email_title}</b>\n{email_body}"
            await send_telegram(user.telegram_chat_id, text)
            await _log(db, user.id, ntype, NotificationChannel.telegram, NotificationStatus.sent, push_data)
            any_sent = True
        except Exception as e:
            await _log(db, user.id, ntype, NotificationChannel.telegram, NotificationStatus.failed, push_data, str(e))

    if any_sent:
        return

    # Email fallback — only if push and telegram both unavailable/failed
    if user.email:
        try:
            html = f"<h2>{email_title}</h2><p>{email_body}</p>"
            await email_adapter.send(user.email, email_title, html, email_body)
            await _log(db, user.id, ntype, NotificationChannel.email, NotificationStatus.sent, push_data)
        except Exception as e:
            await _log(db, user.id, ntype, NotificationChannel.email, NotificationStatus.failed, push_data, str(e))
    else:
        logger.warning("No channels available for user_id=%s", user.id)


async def send_morning_summary(db: AsyncSession, user: User, total_tasks: int) -> None:
    push_data = {"type": "morning_summary", "total": total_tasks, "url": "/daily"}
    email_title, email_body = get_morning_summary(user.language, total_tasks)
    await dispatch(db, user, NotificationType.morning_summary, push_data, email_title, email_body)


async def send_task_reminder(db: AsyncSession, user: User, task_names: list[str]) -> None:
    tasks_str = ", ".join(task_names)
    count = len(task_names)
    push_data = {"type": "task_reminder", "tasks": tasks_str, "count": count, "url": "/daily"}
    email_title = f"⏰ {count} task(s) now"
    email_body = tasks_str
    await dispatch(db, user, NotificationType.task_reminder, push_data, email_title, email_body)


async def send_daily_report(db: AsyncSession, user: User, completed: int, total: int) -> None:
    rate = round(completed / total * 100) if total else 0
    push_data = {"type": "daily_report", "completed": completed, "total": total, "rate": rate, "url": "/reports"}
    email_title, email_body = get_daily_report(user.language, completed, total, rate)
    await dispatch(db, user, NotificationType.daily_report, push_data, email_title, email_body)


async def send_burnout_alert(db: AsyncSession, user: User) -> None:
    push_data = {"type": "burnout_alert", "url": "/daily"}
    email_title, email_body = get_burnout_alert(user.language)
    await dispatch(db, user, NotificationType.burnout_alert, push_data, email_title, email_body)


async def send_weekly_review(
    db: AsyncSession, user: User,
    completed: int, total: int, rate: int,
    trend_arrow: str, trend: str, trend_delta: int, best: str | None,
) -> None:
    push_data = {
        "type": "weekly_review",
        "completed": completed,
        "total": total,
        "rate": rate,
        "trend_arrow": trend_arrow,
        "best": best or "",
        "url": "/reports",
    }
    email_title, email_body = get_weekly_review(
        user.language, completed, total, rate, trend_arrow, trend, trend_delta, best
    )
    await dispatch(db, user, NotificationType.weekly_review, push_data, email_title, email_body)
