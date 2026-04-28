"""Notification dispatcher: push first, email fallback."""

import json
import logging
from datetime import date

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_log import NotificationChannel, NotificationLog, NotificationStatus, NotificationType
from app.models.user import User
from app.models.user_device import UserDevice
from app.services.email_service import email_adapter, MORNING_SUMMARY_HTML, DAILY_REPORT_HTML
from app.services.push_service import send_push

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
    title: str,
    body: str,
    payload: dict | None = None,
) -> None:
    devices = await _get_user_devices(db, user.id)

    if devices:
        for device in devices:
            try:
                await send_push(device.push_subscription, title, body)
                await _log(db, user.id, ntype, NotificationChannel.push, NotificationStatus.sent, payload)
                return
            except Exception as e:
                await _log(
                    db, user.id, ntype, NotificationChannel.push,
                    NotificationStatus.failed, payload, str(e)
                )

    # fallback to email
    if user.email:
        try:
            html = f"<h2>{title}</h2><p>{body}</p>"
            await email_adapter.send(user.email, title, html, body)
            await _log(db, user.id, ntype, NotificationChannel.email, NotificationStatus.sent, payload)
        except Exception as e:
            await _log(
                db, user.id, ntype, NotificationChannel.email,
                NotificationStatus.failed, payload, str(e)
            )
    else:
        logger.warning("No push devices and no email for user_id=%s", user.id)


async def send_morning_summary(db: AsyncSession, user: User, total_tasks: int) -> None:
    await dispatch(
        db, user,
        NotificationType.morning_summary,
        "Good morning! ☀️",
        f"You have {total_tasks} tasks today. Let's go!",
        {"total_tasks": total_tasks},
    )


async def send_daily_report(
    db: AsyncSession, user: User, completed: int, total: int
) -> None:
    rate = round(completed / total * 100) if total else 0
    await dispatch(
        db, user,
        NotificationType.daily_report,
        "Daily Report 📊",
        f"You completed {completed}/{total} tasks today ({rate}%).",
        {"completed": completed, "total": total},
    )
