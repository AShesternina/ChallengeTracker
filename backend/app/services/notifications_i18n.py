"""Notification text translations keyed by user.language."""

_MORNING_SUMMARY: dict[str, tuple[str, str]] = {
    "en": ("Good morning! ☀️",        "You have {total} tasks today. Let's go!"),
    "ru": ("Доброе утро! ☀️",          "Сегодня у вас {total} задач. Вперёд!"),
    "es": ("¡Buenos días! ☀️",         "Tienes {total} tareas hoy. ¡Vamos!"),
    "pt": ("Bom dia! ☀️",              "Você tem {total} tarefas hoje. Vamos lá!"),
}

_DAILY_REPORT: dict[str, tuple[str, str]] = {
    "en": ("Daily Report 📊",          "You completed {completed}/{total} tasks today ({rate}%)."),
    "ru": ("Итоги дня 📊",             "Сегодня выполнено {completed}/{total} задач ({rate}%)."),
    "es": ("Informe diario 📊",        "Completaste {completed}/{total} tareas hoy ({rate}%)."),
    "pt": ("Relatório diário 📊",      "Você concluiu {completed}/{total} tarefas hoje ({rate}%)."),
}

_WEEKLY_REVIEW: dict[str, tuple[str, str]] = {
    "en": ("Weekly Review 📅",         "Week: {completed}/{total} tasks ({rate}%) {trend_arrow}. Best: {best}."),
    "ru": ("Итоги недели 📅",          "Неделя: {completed}/{total} задач ({rate}%) {trend_arrow}. Лучший: {best}."),
    "es": ("Revisión semanal 📅",      "Semana: {completed}/{total} tareas ({rate}%) {trend_arrow}. Mejor: {best}."),
    "pt": ("Revisão semanal 📅",       "Semana: {completed}/{total} tarefas ({rate}%) {trend_arrow}. Melhor: {best}."),
}

_WEEKLY_REVIEW_NO_BEST: dict[str, tuple[str, str]] = {
    "en": ("Weekly Review 📅",         "Week: {completed}/{total} tasks ({rate}%) {trend_arrow}."),
    "ru": ("Итоги недели 📅",          "Неделя: {completed}/{total} задач ({rate}%) {trend_arrow}."),
    "es": ("Revisión semanal 📅",      "Semana: {completed}/{total} tareas ({rate}%) {trend_arrow}."),
    "pt": ("Revisão semanal 📅",       "Semana: {completed}/{total} tarefas ({rate}%) {trend_arrow}."),
}


def get_morning_summary(lang: str, total: int) -> tuple[str, str]:
    title, body_tpl = _MORNING_SUMMARY.get(lang, _MORNING_SUMMARY["en"])
    return title, body_tpl.format(total=total)


def get_daily_report(lang: str, completed: int, total: int, rate: int) -> tuple[str, str]:
    title, body_tpl = _DAILY_REPORT.get(lang, _DAILY_REPORT["en"])
    return title, body_tpl.format(completed=completed, total=total, rate=rate)


def get_weekly_review(
    lang: str, completed: int, total: int, rate: int, trend_arrow: str, best: str | None
) -> tuple[str, str]:
    if best:
        title, body_tpl = _WEEKLY_REVIEW.get(lang, _WEEKLY_REVIEW["en"])
        return title, body_tpl.format(completed=completed, total=total, rate=rate, trend_arrow=trend_arrow, best=best)
    title, body_tpl = _WEEKLY_REVIEW_NO_BEST.get(lang, _WEEKLY_REVIEW_NO_BEST["en"])
    return title, body_tpl.format(completed=completed, total=total, rate=rate, trend_arrow=trend_arrow)
