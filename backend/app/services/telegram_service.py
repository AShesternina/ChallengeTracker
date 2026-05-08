"""Telegram notification service — sends messages via Bot API."""

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_API = "https://api.telegram.org/bot{token}/{method}"


async def send_telegram(chat_id: int, text: str) -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.info("[MOCK TELEGRAM] chat_id=%s text=%s", chat_id, text)
        return

    import httpx

    url = _API.format(token=settings.TELEGRAM_BOT_TOKEN, method="sendMessage")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        })
        resp.raise_for_status()


async def send_telegram_raw(chat_id: int, text: str) -> None:
    """Fire-and-forget wrapper — used in webhook replies."""
    try:
        await send_telegram(chat_id, text)
    except Exception as e:
        logger.warning("Telegram reply failed: %s", e)
