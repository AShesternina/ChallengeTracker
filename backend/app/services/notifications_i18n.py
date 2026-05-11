"""Notification text translations keyed by user.language."""

# ── Morning summary ──────────────────────────────────────────────────────────

_MORNING_DEFAULT: dict[str, tuple[str, str]] = {
    "en": ("Good morning! ☀️",         "You have {total} tasks today. Let's go!"),
    "ru": ("Доброе утро! ☀️",           "Сегодня {total} задач. Давай начнём!"),
    "es": ("¡Buenos días! ☀️",          "Tienes {total} tareas hoy. ¡Vamos!"),
    "pt": ("Bom dia! ☀️",               "Você tem {total} tarefas hoje. Vamos lá!"),
}

_MORNING_STREAK: dict[str, tuple[str, str]] = {
    "en": ("🔥 {streak} days in a row!",   "{total} tasks today. Don't stop now!"),
    "ru": ("🔥 {streak} дней подряд!",      "{total} задач сегодня. Не останавливайся!"),
    "es": ("🔥 ¡{streak} días seguidos!",   "{total} tareas hoy. ¡No pares ahora!"),
    "pt": ("🔥 {streak} dias seguidos!",    "{total} tarefas hoje. Não pare agora!"),
}


def get_morning_summary(lang: str, total: int, streak: int = 0) -> tuple[str, str]:
    if streak > 1:
        title_tpl, body_tpl = _MORNING_STREAK.get(lang, _MORNING_STREAK["en"])
        return title_tpl.format(streak=streak), body_tpl.format(total=total)
    title, body_tpl = _MORNING_DEFAULT.get(lang, _MORNING_DEFAULT["en"])
    return title, body_tpl.format(total=total)


# ── Daily report ─────────────────────────────────────────────────────────────

_DAILY_PERFECT: dict[str, tuple[str, str]] = {
    "en": ("🎉 Perfect day!",        "All {total} tasks done. You're unstoppable!"),
    "ru": ("🎉 Идеальный день!",     "Все {total} задач выполнены. Так держать!"),
    "es": ("🎉 ¡Día perfecto!",      "¡{total} tareas completadas. Eres imparable!"),
    "pt": ("🎉 Dia perfeito!",       "Todas as {total} tarefas feitas. Você é incrível!"),
}

_DAILY_GREAT: dict[str, tuple[str, str]] = {
    "en": ("💪 Great result!",       "{completed}/{total} tasks — almost perfect. Keep it up!"),
    "ru": ("💪 Отличный результат!", "{completed}/{total} задач — почти идеально. Так держать!"),
    "es": ("💪 ¡Gran resultado!",    "{completed}/{total} tareas — casi perfecto. ¡Sigue así!"),
    "pt": ("💪 Ótimo resultado!",    "{completed}/{total} tarefas — quase perfeito. Continue!"),
}

_DAILY_GOOD: dict[str, tuple[str, str]] = {
    "en": ("👍 Good progress!",      "{completed}/{total} tasks done. Tomorrow we do more!"),
    "ru": ("👍 Хороший прогресс!",   "{completed}/{total} задач выполнено. Завтра сделаем больше!"),
    "es": ("👍 ¡Buen progreso!",     "{completed}/{total} tareas hechas. ¡Mañana más!"),
    "pt": ("👍 Bom progresso!",      "{completed}/{total} tarefas feitas. Amanhã fazemos mais!"),
}

_DAILY_LOW: dict[str, tuple[str, str]] = {
    "en": ("💙 It's okay!",          "{completed}/{total} tasks today. Every step counts — tomorrow is a new chance."),
    "ru": ("💙 Всё хорошо!",         "{completed}/{total} задач сегодня. Каждый шаг важен — завтра новый день."),
    "es": ("💙 ¡Está bien!",         "{completed}/{total} tareas hoy. Cada paso cuenta — mañana es un nuevo comienzo."),
    "pt": ("💙 Tudo bem!",           "{completed}/{total} tarefas hoje. Cada passo conta — amanhã é um novo começo."),
}


def get_daily_report(lang: str, completed: int, total: int, rate: int) -> tuple[str, str]:
    if rate == 100:
        table = _DAILY_PERFECT
    elif rate >= 80:
        table = _DAILY_GREAT
    elif rate >= 50:
        table = _DAILY_GOOD
    else:
        table = _DAILY_LOW
    title, body_tpl = table.get(lang, table["en"])
    return title, body_tpl.format(completed=completed, total=total, rate=rate)


# ── Task reminder ─────────────────────────────────────────────────────────────

_TASK_REMINDER: dict[str, tuple[str, str]] = {
    "en": ("⏰ Time for your task!",   "{tasks}"),
    "ru": ("⏰ Пора браться за дело!", "{tasks}"),
    "es": ("⏰ ¡Hora de tu tarea!",    "{tasks}"),
    "pt": ("⏰ Hora da sua tarefa!",   "{tasks}"),
}


def get_task_reminder(lang: str, tasks: str) -> tuple[str, str]:
    title, body_tpl = _TASK_REMINDER.get(lang, _TASK_REMINDER["en"])
    return title, body_tpl.format(tasks=tasks)


# ── Burnout alert ─────────────────────────────────────────────────────────────

_BURNOUT_ALERT: dict[str, tuple[str, str]] = {
    "en": ("Tough week? That's okay 🌱",      "You can pause a challenge to regroup — that's not giving up, it's being smart."),
    "ru": ("Сложная неделя? Всё ок 🌱",       "Можешь поставить челлендж на паузу — это не сдаться, а перегруппироваться."),
    "es": ("¿Semana difícil? Está bien 🌱",   "Puedes pausar un desafío para reagruparte — eso no es rendirse, es ser inteligente."),
    "pt": ("Semana difícil? Tudo bem 🌱",     "Você pode pausar um desafio para se reorganizar — isso não é desistir, é ser inteligente."),
}


def get_burnout_alert(lang: str) -> tuple[str, str]:
    return _BURNOUT_ALERT.get(lang, _BURNOUT_ALERT["en"])


# ── Weekly review ─────────────────────────────────────────────────────────────

_WEEKLY_HIGH_TITLE: dict[str, str] = {
    "en": "🏆 Strong week!",
    "ru": "🏆 Сильная неделя!",
    "es": "🏆 ¡Semana fuerte!",
    "pt": "🏆 Semana forte!",
}

_WEEKLY_NORMAL_TITLE: dict[str, str] = {
    "en": "📊 Weekly recap",
    "ru": "📊 Итоги недели",
    "es": "📊 Resumen semanal",
    "pt": "📊 Resumo semanal",
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

_WEEKLY_NEXT_LABEL: dict[str, str] = {
    "en": "Next week — better!",
    "ru": "Следующая неделя — лучше!",
    "es": "¡La próxima semana mejor!",
    "pt": "Próxima semana melhor!",
}


def get_weekly_review(
    lang: str, completed: int, total: int, rate: int,
    trend_arrow: str, trend: str, trend_delta: int, best: str | None,
) -> tuple[str, str]:
    title = (_WEEKLY_HIGH_TITLE if rate >= 80 else _WEEKLY_NORMAL_TITLE).get(lang, "📊")
    trend_label = _WEEKLY_TREND_LABEL.get(trend, _WEEKLY_TREND_LABEL["stable"]).get(lang, "")
    if trend != "stable" and trend_delta > 0:
        trend_label += f" (+{trend_delta}%)" if trend == "up" else f" (-{trend_delta}%)"
    best_label = _WEEKLY_BEST_LABEL.get(lang, _WEEKLY_BEST_LABEL["en"])

    lines = [f"✅ <b>{completed}/{total}</b> · <b>{rate}%</b>", trend_label]
    if best:
        lines.append(f"{best_label}: <b>{best}</b>")
    if rate < 80:
        lines.append(_WEEKLY_NEXT_LABEL.get(lang, _WEEKLY_NEXT_LABEL["en"]))

    return title, "\n".join(lines)
