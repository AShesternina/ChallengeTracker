"""Web Push notification service."""

import json
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_push_sync(subscription_json: str, title: str, body: str, url: str = "/") -> None:
    """Synchronous push — called from Celery worker thread."""
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.info("[MOCK PUSH] title=%s body=%s", title, body)
        return

    try:
        from pywebpush import webpush, WebPushException

        subscription = json.loads(subscription_json)
        webpush(
            subscription_info=subscription,
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_MAILTO},
        )
    except Exception as e:
        logger.warning("Push failed: %s", e)
        raise


async def send_push(subscription_json: str, title: str, body: str, url: str = "/") -> None:
    """Async wrapper — runs sync push in thread pool."""
    import asyncio

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_push_sync, subscription_json, title, body, url)
