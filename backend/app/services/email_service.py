"""Email adapter with SendGrid + mock fallback."""

import logging
from abc import ABC, abstractmethod

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailAdapter(ABC):
    @abstractmethod
    async def send(self, to: str, subject: str, html: str, text: str) -> None:
        ...


class MockEmailAdapter(EmailAdapter):
    async def send(self, to: str, subject: str, html: str, text: str) -> None:
        logger.info("[MOCK EMAIL] to=%s subject=%s", to, subject)
        logger.debug("[MOCK EMAIL] body=%s", text)


class ResendEmailAdapter(EmailAdapter):
    async def send(self, to: str, subject: str, html: str, text: str) -> None:
        import httpx

        payload = {
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": [to],
            "subject": subject,
            "html": html,
            "text": text,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                json=payload,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                timeout=10,
            )
            resp.raise_for_status()


class SendGridEmailAdapter(EmailAdapter):
    async def send(self, to: str, subject: str, html: str, text: str) -> None:
        import httpx

        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": settings.EMAIL_FROM, "name": settings.EMAIL_FROM_NAME},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": text},
                {"type": "text/html", "value": html},
            ],
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}"},
                timeout=10,
            )
            resp.raise_for_status()


def get_email_adapter() -> EmailAdapter:
    if settings.RESEND_API_KEY:
        return ResendEmailAdapter()
    if settings.SENDGRID_API_KEY:
        return SendGridEmailAdapter()
    return MockEmailAdapter()


email_adapter = get_email_adapter()


MORNING_SUMMARY_HTML = """
<h2>Good morning! 🌅</h2>
<p>You have <strong>{total}</strong> tasks today.</p>
<p>Let's crush it!</p>
"""

DAILY_REPORT_HTML = """
<h2>Daily Report 📊</h2>
<p>Completed: <strong>{completed}/{total}</strong> ({rate}%)</p>
"""
