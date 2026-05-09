"""Telegram notification service — sends messages via Bot API."""

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_DIRECT_API = "https://api.telegram.org/bot{token}/{method}"
_PROXY_API = "{proxy}/bot{token}/{method}"


async def send_telegram(chat_id: int, text: str) -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.info("[MOCK TELEGRAM] chat_id=%s text=%s", chat_id, text)
        return

    import httpx

    if settings.TELEGRAM_PROXY_URL:
        url = _PROXY_API.format(
            proxy=settings.TELEGRAM_PROXY_URL.rstrip("/"),
            token=settings.TELEGRAM_BOT_TOKEN,
            method="sendMessage",
        )
        headers = {"X-Proxy-Secret": settings.TELEGRAM_PROXY_SECRET}
    else:
        url = _DIRECT_API.format(token=settings.TELEGRAM_BOT_TOKEN, method="sendMessage")
        headers = {}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        }, headers=headers)
        resp.raise_for_status()


async def send_telegram_raw(chat_id: int, text: str) -> None:
    """Fire-and-forget wrapper — used in webhook replies."""
    try:
        await send_telegram(chat_id, text)
    except Exception as e:
        logger.warning("Telegram reply failed: %s", e)
