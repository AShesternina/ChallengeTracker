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

_TASK_REMINDER: dict[str, tuple[str, str]] = {
    "en": ("⏰ Time for your tasks!",       "{tasks}"),
    "ru": ("⏰ Время для задач!",            "{tasks}"),
    "es": ("⏰ ¡Hora de tus tareas!",       "{tasks}"),
    "pt": ("⏰ Hora das suas tarefas!",     "{tasks}"),
}


def get_task_reminder(lang: str, tasks: str) -> tuple[str, str]:
    title, body_tpl = _TASK_REMINDER.get(lang, _TASK_REMINDER["en"])
    return title, body_tpl.format(tasks=tasks)


_BURNOUT_ALERT: dict[str, tuple[str, str]] = {
    "en": ("Feeling off track? That's okay 💪", "Even one small task counts. You've got this — keep going!"),
    "ru": ("Сложные дни бывают у всех 💪",      "Даже одна маленькая задача — это уже победа. Ты справишься!"),
    "es": ("¿Días difíciles? Es normal 💪",      "Incluso una pequeña tarea cuenta. ¡Tú puedes, sigue adelante!"),
    "pt": ("Dias difíceis acontecem 💪",          "Até uma pequena tarefa conta. Você consegue — continue!"),
}


def get_burnout_alert(lang: str) -> tuple[str, str]:
    return _BURNOUT_ALERT.get(lang, _BURNOUT_ALERT["en"])


_WEEKLY_REVIEW_TITLE: dict[str, str] = {
    "en": "Weekly recap 🔥",
    "ru": "Итоги недели 🔥",
    "es": "Resumen semanal 🔥",
    "pt": "Resumo semanal 🔥",
}

_WEEKLY_TREND_LABEL: dict[str, dict[str, str]] = {
    "up":     {"en": "↑ Better than last week", "ru": "↑ Лучше прошлой недели", "es": "↑ Mejor que la semana pasada", "pt": "↑ Melhor que a semana passada"},
    "down":   {"en": "↓ Lower than last week",  "ru": "↓ Хуже прошлой недели",  "es": "↓ Peor que la semana pasada",  "pt": "↓ Pior que a semana passada"},
    "stable": {"en": "→ Same as last week",      "ru": "→ Как на прошлой неделе", "es": "→ Igual que la semana pasada", "pt": "→ Igual à semana passada"},
}

_WEEKLY_BEST_LABEL: dict[str, str] = {
    "en": "🏆 Best challenge",
    "ru": "🏆 Лучший челлендж",
    "es": "🏆 Mejor desafío",
    "pt": "🏆 Melhor desafio",
}


def get_morning_summary(lang: str, total: int) -> tuple[str, str]:
    title, body_tpl = _MORNING_SUMMARY.get(lang, _MORNING_SUMMARY["en"])
    return title, body_tpl.format(total=total)


def get_daily_report(lang: str, completed: int, total: int, rate: int) -> tuple[str, str]:
    title, body_tpl = _DAILY_REPORT.get(lang, _DAILY_REPORT["en"])
    return title, body_tpl.format(completed=completed, total=total, rate=rate)


def get_weekly_review(
    lang: str, completed: int, total: int, rate: int,
    trend_arrow: str, trend: str, trend_delta: int, best: str | None,
) -> tuple[str, str]:
    title = _WEEKLY_TREND_LABEL.get("up", {}).get(lang)  # resolve lang below
    title = _WEEKLY_REVIEW_TITLE.get(lang, _WEEKLY_REVIEW_TITLE["en"])
    trend_label = _WEEKLY_TREND_LABEL.get(trend, _WEEKLY_TREND_LABEL["stable"]).get(lang, _WEEKLY_TREND_LABEL["stable"]["en"])
    if trend != "stable" and trend_delta > 0:
        trend_label += f" (+{trend_delta}%)" if trend == "up" else f" (-{trend_delta}%)"
    best_label = _WEEKLY_BEST_LABEL.get(lang, _WEEKLY_BEST_LABEL["en"])

    lines = [
        f"✅ <b>{completed}/{total}</b> · <b>{rate}%</b>",
        trend_label,
    ]
    if best:
        lines.append(f"{best_label}: <b>{best}</b>")

    return title, "\n".join(lines)
