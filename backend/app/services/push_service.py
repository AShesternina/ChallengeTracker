"""Web Push notification service — sends data-only payloads (Variant B).
The Service Worker on the client translates the payload using its built-in
i18n dict, so no text is hardcoded here.
"""

import json
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_push_sync(subscription_json: str, data: dict) -> None:
    """Synchronous push — called from Celery worker thread."""
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.info("[MOCK PUSH] data=%s", data)
        return

    try:
        from pywebpush import webpush, WebPushException

        subscription = json.loads(subscription_json)
        webpush(
            subscription_info=subscription,
            data=json.dumps(data),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_MAILTO},
        )
    except Exception as e:
        logger.warning("Push failed: %s", e)
        raise


async def send_push(subscription_json: str, data: dict) -> None:
    """Async wrapper — runs sync push in thread pool."""
    import asyncio

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_push_sync, subscription_json, data)
