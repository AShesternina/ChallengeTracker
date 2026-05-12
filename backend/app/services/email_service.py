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


# ─── Email report templates ──────────────────────────────────────────────────

_DAILY_STRINGS: dict[str, dict] = {
    "en": {
        "greeting": "Hi",
        "subject": "📊 Daily results",
        "heading": "Here's how your day went",
        "tasks": "tasks completed",
        "streak": "🔥 {n}-day streak",
        "cta": "View Full Report →",
        "footer": "You receive this because you enabled daily email reports. Change in app settings.",
    },
    "ru": {
        "greeting": "Привет",
        "subject": "📊 Итоги дня",
        "heading": "Вот как прошёл твой день",
        "tasks": "задач выполнено",
        "streak": "🔥 серия {n} {days}",
        "cta": "Смотреть отчёт →",
        "footer": "Вы получаете это письмо, так как включили ежедневные отчёты. Настройки — в приложении.",
    },
    "es": {
        "greeting": "Hola",
        "subject": "📊 Resultados del día",
        "heading": "Así fue tu día",
        "tasks": "tareas completadas",
        "streak": "🔥 racha de {n} días",
        "cta": "Ver informe completo →",
        "footer": "Recibes esto porque activaste los informes diarios por email. Cámbialo en la app.",
    },
    "pt": {
        "greeting": "Olá",
        "subject": "📊 Resultados do dia",
        "heading": "Veja como foi o seu dia",
        "tasks": "tarefas concluídas",
        "streak": "🔥 sequência de {n} dias",
        "cta": "Ver relatório completo →",
        "footer": "Você recebe isso porque ativou os relatórios diários por email. Altere nas configurações.",
    },
}

_WEEKLY_STRINGS: dict[str, dict] = {
    "en": {
        "greeting": "Hi",
        "subject": "🏆 Weekly summary",
        "heading": "Your week at a glance",
        "tasks": "tasks this week",
        "trend_up": "↑ Better than last week",
        "trend_down": "↓ Slightly below last week",
        "trend_stable": "→ Same as last week",
        "best": "Best challenge",
        "streak": "🔥 {n}-day streak",
        "cta": "View Weekly Report →",
        "footer": "You receive this because you enabled weekly email reports. Change in app settings.",
    },
    "ru": {
        "greeting": "Привет",
        "subject": "🏆 Итоги недели",
        "heading": "Как прошла неделя",
        "tasks": "задач за неделю",
        "trend_up": "↑ Лучше, чем на прошлой неделе",
        "trend_down": "↓ Чуть хуже прошлой недели",
        "trend_stable": "→ Как на прошлой неделе",
        "best": "Лучший челлендж",
        "streak": "🔥 серия {n} {days}",
        "cta": "Смотреть недельный отчёт →",
        "footer": "Вы получаете это письмо, так как включили еженедельные отчёты. Настройки — в приложении.",
    },
    "es": {
        "greeting": "Hola",
        "subject": "🏆 Resumen semanal",
        "heading": "Tu semana de un vistazo",
        "tasks": "tareas esta semana",
        "trend_up": "↑ Mejor que la semana pasada",
        "trend_down": "↓ Algo por debajo de la semana pasada",
        "trend_stable": "→ Igual que la semana pasada",
        "best": "Mejor desafío",
        "streak": "🔥 racha de {n} días",
        "cta": "Ver informe semanal →",
        "footer": "Recibes esto porque activaste los informes semanales por email. Cámbialo en la app.",
    },
    "pt": {
        "greeting": "Olá",
        "subject": "🏆 Resumo semanal",
        "heading": "Sua semana em destaque",
        "tasks": "tarefas esta semana",
        "trend_up": "↑ Melhor que a semana passada",
        "trend_down": "↓ Abaixo da semana passada",
        "trend_stable": "→ Igual à semana passada",
        "best": "Melhor desafio",
        "streak": "🔥 sequência de {n} dias",
        "cta": "Ver relatório semanal →",
        "footer": "Você recebe isso porque ativou os relatórios semanais por email. Altere nas configurações.",
    },
}

_BREAKDOWN_LABELS: dict[str, str] = {
    "en": "Challenges",
    "ru": "Челленджи",
    "es": "Desafíos",
    "pt": "Desafios",
}


def _challenges_html(challenges: list[dict], lang: str) -> str:
    """Renders a per-challenge breakdown table for email HTML."""
    if not challenges:
        return ""
    from app.services.notifications_i18n import translate_challenge_title

    label = _BREAKDOWN_LABELS.get(lang, "Challenges")
    rows = ""
    for c in challenges:
        translated = translate_challenge_title(c["title"], lang)
        rate = c["rate"]
        color = "#22c55e" if rate == 100 else ("#f59e0b" if rate >= 50 else "#ef4444")
        icon = "✅" if rate == 100 else ("⏳" if rate >= 50 else "❌")
        rows += f"""<tr>
  <td style="padding:7px 0;border-bottom:1px solid #f4f4f5;">
    <span style="font-size:13px;color:#18181b;">{icon} {translated}</span>
  </td>
  <td style="padding:7px 0;border-bottom:1px solid #f4f4f5;text-align:right;white-space:nowrap;">
    <span style="font-size:13px;font-weight:700;color:{color};">{c['completed']}/{c['total']}</span>
  </td>
</tr>"""

    return f"""<p style="margin:20px 0 8px;font-size:11px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">{label}</p>
<table width="100%" cellpadding="0" cellspacing="0">{rows}</table>"""


def _challenges_text(challenges: list[dict], lang: str) -> str:
    if not challenges:
        return ""
    from app.services.notifications_i18n import translate_challenge_title
    label = _BREAKDOWN_LABELS.get(lang, "Challenges")
    lines = [f"\n{label}:"]
    for c in challenges:
        translated = translate_challenge_title(c["title"], lang)
        icon = "✅" if c["rate"] == 100 else ("⏳" if c["rate"] >= 50 else "❌")
        lines.append(f"  {icon} {translated}: {c['completed']}/{c['total']}")
    return "\n".join(lines)


def _ru_days(n: int) -> str:
    """Russian declension for «день/дня/дней»."""
    if 11 <= (n % 100) <= 19:
        return "дней"
    r = n % 10
    if r == 1:
        return "день"
    if 2 <= r <= 4:
        return "дня"
    return "дней"


def _bar_color(rate: int) -> str:
    if rate == 100:
        return "#22c55e"
    if rate >= 80:
        return "#3b82f6"
    if rate >= 50:
        return "#f59e0b"
    return "#ef4444"


def _build_html(body_html: str, footer_text: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
<tr><td style="padding:22px 32px 18px;border-bottom:1px solid #f0f0f0;">
  <span style="font-size:17px;font-weight:900;color:#3b82f6;letter-spacing:-0.4px;">ChallengeTracker</span>
</td></tr>
<tr><td style="padding:28px 32px 24px;">
{body_html}
</td></tr>
<tr><td style="padding:14px 32px 22px;border-top:1px solid #f0f0f0;">
  <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;line-height:1.5;">{footer_text}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


def get_daily_report_email(
    lang: str,
    name: str | None,
    completed: int,
    total: int,
    rate: int,
    streak: int,
    challenges: list[dict] | None = None,
) -> tuple[str, str, str]:
    """Returns (subject, html, text) for the daily email report."""
    s = _DAILY_STRINGS.get(lang, _DAILY_STRINGS["en"])
    display_name = name or ""
    greeting = f"{s['greeting']}{', ' + display_name if display_name else ''}!"
    bar_color = _bar_color(rate)

    streak_label = s["streak"].format(n=streak, days=_ru_days(streak) if lang == "ru" else "")
    streak_html = ""
    if streak > 0:
        streak_html = f"""<div style="background:#fef3c7;border-radius:10px;padding:10px 16px;margin-bottom:20px;text-align:center;">
  <span style="font-size:15px;font-weight:700;color:#92400e;">{streak_label}</span>
</div>"""

    table_html = _challenges_html(challenges or [], lang)
    table_text = _challenges_text(challenges or [], lang)

    body_html = f"""<p style="margin:0 0 4px;font-size:14px;color:#71717a;">{greeting}</p>
<h2 style="margin:0 0 24px;font-size:22px;font-weight:900;color:#18181b;letter-spacing:-0.4px;">{s['heading']}</h2>
<div style="text-align:center;margin-bottom:16px;">
  <span style="font-size:56px;font-weight:900;color:#18181b;letter-spacing:-3px;">{completed}</span>
  <span style="font-size:26px;font-weight:600;color:#a1a1aa;"> / {total}</span>
  <p style="margin:6px 0 0;font-size:13px;color:#71717a;font-weight:500;">{s['tasks']}</p>
</div>
<div style="background:#f4f4f5;border-radius:8px;overflow:hidden;margin-bottom:20px;">
  <div style="height:8px;background:{bar_color};border-radius:8px;width:{rate}%;"></div>
</div>
{streak_html}{table_html}"""

    subject = f"{s['subject']} — {completed}/{total} ({rate}%)"
    html = _build_html(body_html, s["footer"])
    text = f"ChallengeTracker\n\n{greeting}\n{s['heading']}\n\n{completed}/{total} {s['tasks']} ({rate}%)\n"
    if streak > 0:
        text += f"{streak_label}\n"
    text += table_text
    text += f"\n\n---\n{s['footer']}"
    return subject, html, text


def get_weekly_report_email(
    lang: str,
    name: str | None,
    completed: int,
    total: int,
    rate: int,
    trend_arrow: str,
    trend_delta: int,
    best: str | None,
    streak: int = 0,
    challenges: list[dict] | None = None,
) -> tuple[str, str, str]:
    """Returns (subject, html, text) for the weekly email report."""
    s = _WEEKLY_STRINGS.get(lang, _WEEKLY_STRINGS["en"])
    display_name = name or ""
    greeting = f"{s['greeting']}{', ' + display_name if display_name else ''}!"
    bar_color = _bar_color(rate)

    if trend_arrow == "↑":
        trend_text = s["trend_up"]
        trend_color = "#22c55e"
    elif trend_arrow == "↓":
        trend_text = s["trend_down"]
        trend_color = "#ef4444"
    else:
        trend_text = s["trend_stable"]
        trend_color = "#71717a"

    best_html = ""
    best_text = ""
    if best:
        from app.services.notifications_i18n import translate_challenge_title
        best_translated = translate_challenge_title(best, lang)
        best_html = f"""<div style="background:#eff6ff;border-radius:10px;padding:10px 16px;margin-bottom:16px;">
  <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:0.5px;">{s['best']}</p>
  <p style="margin:0;font-size:14px;font-weight:700;color:#1d4ed8;">🏆 {best_translated}</p>
</div>"""
        best_text = f"\n{s['best']}: {best_translated}"

    streak_label = s["streak"].format(n=streak, days=_ru_days(streak) if lang == "ru" else "")
    streak_html = ""
    if streak > 0:
        streak_html = f"""<div style="background:#fef3c7;border-radius:10px;padding:10px 16px;margin-bottom:16px;text-align:center;">
  <span style="font-size:15px;font-weight:700;color:#92400e;">{streak_label}</span>
</div>"""

    table_html = _challenges_html(challenges or [], lang)
    table_text = _challenges_text(challenges or [], lang)

    body_html = f"""<p style="margin:0 0 4px;font-size:14px;color:#71717a;">{greeting}</p>
<h2 style="margin:0 0 24px;font-size:22px;font-weight:900;color:#18181b;letter-spacing:-0.4px;">{s['heading']}</h2>
<div style="text-align:center;margin-bottom:16px;">
  <span style="font-size:56px;font-weight:900;color:#18181b;letter-spacing:-3px;">{completed}</span>
  <span style="font-size:26px;font-weight:600;color:#a1a1aa;"> / {total}</span>
  <p style="margin:6px 0 0;font-size:13px;color:#71717a;font-weight:500;">{s['tasks']}</p>
</div>
<div style="background:#f4f4f5;border-radius:8px;overflow:hidden;margin-bottom:16px;">
  <div style="height:8px;background:{bar_color};border-radius:8px;width:{rate}%;"></div>
</div>
<p style="margin:0 0 16px;font-size:13px;font-weight:600;color:{trend_color};text-align:center;">{trend_text}</p>
{best_html}
{streak_html}{table_html}"""

    subject = f"{s['subject']} — {rate}% {trend_arrow}"
    html = _build_html(body_html, s["footer"])
    text = f"ChallengeTracker\n\n{greeting}\n{s['heading']}\n\n{completed}/{total} {s['tasks']} ({rate}%) {trend_text}"
    text += best_text
    if streak > 0:
        text += f"\n{streak_label}"
    text += table_text
    text += f"\n\n---\n{s['footer']}"
    return subject, html, text


async def send_daily_report_email(
    user: "object",
    completed: int,
    total: int,
    rate: int,
    streak: int,
    challenges: list[dict] | None = None,
) -> None:
    if not getattr(user, "email", None):
        return
    subject, html, text = get_daily_report_email(
        user.language, user.name, completed, total, rate, streak, challenges
    )
    await email_adapter.send(user.email, subject, html, text)


async def send_weekly_report_email(
    user: "object",
    completed: int,
    total: int,
    rate: int,
    trend_arrow: str,
    trend_delta: int,
    best: str | None,
    streak: int = 0,
    challenges: list[dict] | None = None,
) -> None:
    if not getattr(user, "email", None):
        return
    subject, html, text = get_weekly_report_email(
        user.language, user.name, completed, total, rate, trend_arrow, trend_delta, best, streak, challenges
    )
    await email_adapter.send(user.email, subject, html, text)
