"""Notification text translations keyed by user.language."""

# ── Challenge title translations (same mapping as frontend templateTranslations.ts) ──

_CHALLENGE_TITLES: dict[str, dict[str, str]] = {
    "Healthy Sleep":              {"ru": "Здоровый сон",             "es": "Dormir bien",              "pt": "Dormir bem"},
    "8 Glasses of Water":         {"ru": "Правило 8 стаканов",       "es": "8 vasos de agua",          "pt": "8 copos de água"},
    "Daily Vitamins":             {"ru": "Приём витаминов",           "es": "Vitaminas diarias",        "pt": "Vitaminas diárias"},
    "No Sugar":                   {"ru": "Без сахара",               "es": "Sin azúcar",               "pt": "Sem açúcar"},
    "Morning Pages":              {"ru": "Утренние страницы",         "es": "Páginas matutinas",        "pt": "Páginas matinais"},
    "Pomodoro Method":            {"ru": "Метод Помидора",            "es": "Método Pomodoro",          "pt": "Método Pomodoro"},
    "No Social Media Until Noon": {"ru": "Без соцсетей до полудня",  "es": "Sin redes hasta el mediodía", "pt": "Sem redes até o meio-dia"},
    "Evening Review":             {"ru": "Вечерняя рефлексия",        "es": "Revisión nocturna",        "pt": "Revisão noturna"},
    "Morning Workout":            {"ru": "Утренняя тренировка",       "es": "Entrenamiento matutino",   "pt": "Treino matinal"},
    "Push-ups 3x Day":            {"ru": "Отжимания 3×день",         "es": "Flexiones 3×día",          "pt": "Flexões 3×dia"},
    "10,000 Steps":               {"ru": "10 000 шагов",             "es": "10.000 pasos",             "pt": "10.000 passos"},
    "Cold Shower":                {"ru": "Холодный душ",             "es": "Ducha fría",               "pt": "Banho frio"},
    "Meditation":                 {"ru": "Медитация",                "es": "Meditación",               "pt": "Meditação"},
    "Breathing Practice":         {"ru": "Дыхательная практика",     "es": "Práctica de respiración",  "pt": "Prática de respiração"},
    "Gratitude Journal":          {"ru": "Дневник благодарности",    "es": "Diario de gratitud",       "pt": "Diário de gratidão"},
    "Phone-Free Evening":         {"ru": "Вечер без телефона",       "es": "Tarde sin teléfono",       "pt": "Tarde sem celular"},
    # New templates v2
    "Blood Pressure Check":       {"ru": "Контроль давления",         "es": "Control de presión",        "pt": "Controle de pressão"},
    "Daily Vegetables":           {"ru": "Овощи каждый день",         "es": "Verduras cada día",         "pt": "Vegetais todo dia"},
    "Read 20 Pages":              {"ru": "Читать 20 страниц",         "es": "Leer 20 páginas",           "pt": "Ler 20 páginas"},
    "1 Course Lesson Daily":      {"ru": "1 урок курса в день",       "es": "1 lección de curso al día", "pt": "1 aula de curso por dia"},
    "Learn 20 Words":             {"ru": "Учить 20 слов в день",      "es": "Aprender 20 palabras",      "pt": "Aprender 20 palavras"},
    "Coding Practice":            {"ru": "Практика программирования", "es": "Práctica de programación",  "pt": "Prática de programação"},
    "Deep Work 2 Hours":          {"ru": "Deep Work 2 часа",          "es": "Trabajo profundo 2 horas",  "pt": "Trabalho profundo 2 horas"},
    "Daily Planning":             {"ru": "Планирование дня",          "es": "Planificación diaria",      "pt": "Planejamento diário"},
    "3 Main Tasks":               {"ru": "3 главные задачи",          "es": "3 tareas principales",      "pt": "3 tarefas principais"},
    "15 Min Cleaning":            {"ru": "Уборка 15 минут",           "es": "Limpieza 15 minutos",       "pt": "Limpeza 15 minutos"},
    "Clean Desk":                 {"ru": "Чистый стол",               "es": "Escritorio limpio",         "pt": "Mesa limpa"},
    "Declutter":                  {"ru": "Разбор вещей",              "es": "Ordenar cosas",             "pt": "Organizar coisas"},
    "Minimalism 1 Item":          {"ru": "Минимализм: 1 вещь",        "es": "Minimalismo: 1 cosa",       "pt": "Minimalismo: 1 item"},
    "Daily Expense Tracking":     {"ru": "Учёт расходов",             "es": "Control de gastos",         "pt": "Controle de gastos"},
    "No Spend Day":               {"ru": "День без трат",             "es": "Día sin gastos",            "pt": "Dia sem gastos"},
    "Daily Savings":              {"ru": "Откладывать деньги",        "es": "Ahorro diario",             "pt": "Poupança diária"},
    "Financial Journal":          {"ru": "Финансовый дневник",        "es": "Diario financiero",         "pt": "Diário financiero"},
    "No Alcohol":                 {"ru": "Без алкоголя",              "es": "Sin alcohol",               "pt": "Sem álcool"},
    "No Smoking":                 {"ru": "Без курения",               "es": "Sin fumar",                 "pt": "Sem fumar"},
    "No Late Snacks":             {"ru": "Без поздних перекусов",     "es": "Sin meriendas tardías",     "pt": "Sem lanches noturnos"},
    "Call Loved Ones":            {"ru": "Звонок близким",            "es": "Llamar a seres queridos",   "pt": "Ligar para entes queridos"},
    "Family Time":                {"ru": "Время с семьёй",            "es": "Tiempo en familia",         "pt": "Tempo em família"},
    "Meet a Friend":              {"ru": "Встреча с другом",          "es": "Quedar con un amigo",       "pt": "Encontrar um amigo"},
    "Self-Care Day":              {"ru": "День заботы о себе",        "es": "Día de autocuidado",        "pt": "Dia de autocuidado"},
}


def translate_challenge_title(title: str, lang: str) -> str:
    """Return translated challenge title, fall back to original English if not found."""
    if lang == "en":
        return title
    return _CHALLENGE_TITLES.get(title, {}).get(lang, title)


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


# ── Telegram rich formatters ──────────────────────────────────────────────────
# Returns (text, url) — url is used for the inline "Open app" button.

APP_URL = "https://tracker.shura.pro"

_TG_OPEN_DAILY: dict[str, str] = {
    "en": "Open app →", "ru": "Открыть приложение →",
    "es": "Abrir app →", "pt": "Abrir app →",
}
_TG_OPEN_REPORTS: dict[str, str] = {
    "en": "View report →", "ru": "Посмотреть отчёт →",
    "es": "Ver informe →", "pt": "Ver relatório →",
}

_TG_MORNING_STREAK: dict[str, str] = {
    "en": "🔥 <b>{streak} days in a row!</b>\n\n<b>{total} tasks</b> are waiting today.\nYou're on a roll — don't stop now! ⚡",
    "ru": "🔥 <b>{streak} дней подряд!</b>\n\n<b>{total} задач</b> ждут тебя сегодня.\nТы в потоке — не останавливайся! ⚡",
    "es": "🔥 <b>¡{streak} días seguidos!</b>\n\n<b>{total} tareas</b> te esperan hoy.\n¡Estás en racha — no pares ahora! ⚡",
    "pt": "🔥 <b>{streak} dias seguidos!</b>\n\n<b>{total} tarefas</b> aguardam hoje.\nVocê está em ritmo — não pare agora! ⚡",
}
_TG_MORNING_DEFAULT: dict[str, str] = {
    "en": "☀️ <b>Good morning!</b>\n\nYou have <b>{total} tasks</b> today.\nStart small — and you'll find your rhythm 💪",
    "ru": "☀️ <b>Доброе утро!</b>\n\nСегодня у тебя <b>{total} задач</b>.\nНачни с малого — и войдёшь в ритм 💪",
    "es": "☀️ <b>¡Buenos días!</b>\n\nTienes <b>{total} tareas</b> hoy.\nEmpieza poco a poco — y encontrarás tu ritmo 💪",
    "pt": "☀️ <b>Bom dia!</b>\n\nVocê tem <b>{total} tarefas</b> hoje.\nComeçe devagar — e vai encontrar seu ritmo 💪",
}

_TG_DAILY_PERFECT: dict[str, str] = {
    "en": "🎉 <b>Perfect day!</b>\n\n✅ All <b>{total} tasks</b> completed.\nYou're proving that anything is possible 💫",
    "ru": "🎉 <b>Идеальный день!</b>\n\n✅ Все <b>{total} задач</b> выполнены.\nТы доказываешь, что возможно всё 💫",
    "es": "🎉 <b>¡Día perfecto!</b>\n\n✅ <b>{total} tareas</b> completadas.\nEstás demostrando que todo es posible 💫",
    "pt": "🎉 <b>Dia perfeito!</b>\n\n✅ Todas as <b>{total} tarefas</b> concluídas.\nVocê está provando que tudo é possível 💫",
}
_TG_DAILY_GREAT: dict[str, str] = {
    "en": "💪 <b>Great result!</b>\n\n✅ <b>{completed}/{total}</b> tasks — almost perfect.\nYou're building a strong habit. Keep it up!",
    "ru": "💪 <b>Отличный результат!</b>\n\n✅ <b>{completed}/{total}</b> задач — почти идеально.\nТы строишь крепкую привычку. Так держать!",
    "es": "💪 <b>¡Gran resultado!</b>\n\n✅ <b>{completed}/{total}</b> tareas — casi perfecto.\nEstás construyendo un hábito sólido. ¡Sigue así!",
    "pt": "💪 <b>Ótimo resultado!</b>\n\n✅ <b>{completed}/{total}</b> tarefas — quase perfeito.\nVocê está construindo um hábito sólido. Continue!",
}
_TG_DAILY_GOOD: dict[str, str] = {
    "en": "👍 <b>Good progress!</b>\n\n✅ <b>{completed}/{total}</b> tasks done today.\nEvery completed task is a step forward. Tomorrow we go further!",
    "ru": "👍 <b>Хороший прогресс!</b>\n\n✅ <b>{completed}/{total}</b> задач выполнено сегодня.\nКаждая выполненная задача — шаг вперёд. Завтра идём дальше!",
    "es": "👍 <b>¡Buen progreso!</b>\n\n✅ <b>{completed}/{total}</b> tareas completadas hoy.\nCada tarea es un paso adelante. ¡Mañana vamos más lejos!",
    "pt": "👍 <b>Bom progresso!</b>\n\n✅ <b>{completed}/{total}</b> tarefas feitas hoje.\nCada tarefa é um passo à frente. Amanhã vamos mais longe!",
}
_TG_DAILY_LOW: dict[str, str] = {
    "en": "💙 <b>It's okay!</b>\n\n<b>{completed}/{total}</b> tasks today — that's fine.\nEvery step counts. Tomorrow is a fresh start 🌙",
    "ru": "💙 <b>Всё хорошо!</b>\n\n<b>{completed}/{total}</b> задач сегодня — и это нормально.\nКаждый шаг важен. Завтра — новый день 🌙",
    "es": "💙 <b>¡Está bien!</b>\n\n<b>{completed}/{total}</b> tareas hoy — está bien.\nCada paso cuenta. Mañana es un nuevo comienzo 🌙",
    "pt": "💙 <b>Tudo bem!</b>\n\n<b>{completed}/{total}</b> tarefas hoje — tudo bem.\nCada passo conta. Amanhã é um novo começo 🌙",
}

_TG_TASK_REMINDER: dict[str, str] = {
    "en": "⏰ <b>Time for your task!</b>\n\n{tasks}\n\nComplete it now to keep your progress going 💪",
    "ru": "⏰ <b>Пора браться за дело!</b>\n\n{tasks}\n\nВыполни задачу сейчас — и продолжай двигаться вперёд 💪",
    "es": "⏰ <b>¡Hora de tu tarea!</b>\n\n{tasks}\n\nComplétala ahora para mantener tu progreso 💪",
    "pt": "⏰ <b>Hora da sua tarefa!</b>\n\n{tasks}\n\nConclua agora para manter seu progresso 💪",
}

_TG_BURNOUT: dict[str, str] = {
    "en": "🌱 <b>Tough week? That's okay.</b>\n\nWe noticed things have been hard lately.\nYou can pause a challenge to regroup — that's not giving up, it's being smart.\n\nYou're on the right path 💚",
    "ru": "🌱 <b>Сложная неделя? Всё ок.</b>\n\nЗамечаем, что последние дни даются тяжело.\nМожешь поставить челлендж на паузу — это не сдаться, а грамотно перегруппироваться.\n\nТы на верном пути 💚",
    "es": "🌱 <b>¿Semana difícil? Está bien.</b>\n\nNotamos que los últimos días han sido duros.\nPuedes pausar un desafío para reagruparte — eso no es rendirse, es ser inteligente.\n\nEstás en el camino correcto 💚",
    "pt": "🌱 <b>Semana difícil? Tudo bem.</b>\n\nPercebemos que os últimos dias têm sido pesados.\nVocê pode pausar um desafio para se reorganizar — isso não é desistir, é ser inteligente.\n\nVocê está no caminho certo 💚",
}

_TG_WEEKLY_HIGH: dict[str, str] = {
    "en": "🏆 <b>Strong week!</b>\n\n✅ <b>{completed}/{total}</b> tasks · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\nOutstanding work! Keep it up 🔥",
    "ru": "🏆 <b>Сильная неделя!</b>\n\n✅ <b>{completed}/{total}</b> задач · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\nОтличная работа! Так держать 🔥",
    "es": "🏆 <b>¡Semana fuerte!</b>\n\n✅ <b>{completed}/{total}</b> tareas · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\n¡Trabajo excelente! ¡Sigue así 🔥",
    "pt": "🏆 <b>Semana forte!</b>\n\n✅ <b>{completed}/{total}</b> tarefas · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\nTrabalho excelente! Continue assim 🔥",
}
_TG_WEEKLY_NORMAL: dict[str, str] = {
    "en": "📊 <b>Weekly recap</b>\n\n✅ <b>{completed}/{total}</b> tasks · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\nNext week — let's do even better! 💪",
    "ru": "📊 <b>Итоги недели</b>\n\n✅ <b>{completed}/{total}</b> задач · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\nСледующая неделя — сделаем лучше! 💪",
    "es": "📊 <b>Resumen semanal</b>\n\n✅ <b>{completed}/{total}</b> tareas · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\n¡La próxima semana lo hacemos mejor! 💪",
    "pt": "📊 <b>Resumo semanal</b>\n\n✅ <b>{completed}/{total}</b> tarefas · <b>{rate}%</b> {trend_arrow}\n{trend_label}{best_line}\n\nPróxima semana fazemos melhor! 💪",
}


def get_morning_telegram(lang: str, total: int, streak: int = 0) -> tuple[str, str]:
    if streak > 1:
        text = _TG_MORNING_STREAK.get(lang, _TG_MORNING_STREAK["en"]).format(streak=streak, total=total)
    else:
        text = _TG_MORNING_DEFAULT.get(lang, _TG_MORNING_DEFAULT["en"]).format(total=total)
    return text, f"{APP_URL}/daily"


def get_daily_report_telegram(lang: str, completed: int, total: int, rate: int) -> tuple[str, str]:
    if rate == 100:
        tpl = _TG_DAILY_PERFECT
    elif rate >= 80:
        tpl = _TG_DAILY_GREAT
    elif rate >= 50:
        tpl = _TG_DAILY_GOOD
    else:
        tpl = _TG_DAILY_LOW
    text = tpl.get(lang, tpl["en"]).format(completed=completed, total=total, rate=rate)
    return text, f"{APP_URL}/reports"


def get_task_reminder_telegram(lang: str, tasks: str) -> tuple[str, str]:
    text = _TG_TASK_REMINDER.get(lang, _TG_TASK_REMINDER["en"]).format(tasks=f"<b>{tasks}</b>")
    return text, f"{APP_URL}/daily"


def get_burnout_telegram(lang: str) -> tuple[str, str]:
    return _TG_BURNOUT.get(lang, _TG_BURNOUT["en"]), f"{APP_URL}/daily"


def get_weekly_review_telegram(
    lang: str, completed: int, total: int, rate: int,
    trend_arrow: str, trend: str, trend_delta: int, best: str | None,
) -> tuple[str, str]:
    trend_label = _WEEKLY_TREND_LABEL.get(trend, _WEEKLY_TREND_LABEL["stable"]).get(lang, "")
    if trend != "stable" and trend_delta > 0:
        trend_label += f" (+{trend_delta}%)" if trend == "up" else f" (-{trend_delta}%)"
    best_label = _WEEKLY_BEST_LABEL.get(lang, _WEEKLY_BEST_LABEL["en"])
    best_line = f"\n{best_label}: <b>{best}</b>" if best else ""
    tpl = _TG_WEEKLY_HIGH if rate >= 80 else _TG_WEEKLY_NORMAL
    text = tpl.get(lang, tpl["en"]).format(
        completed=completed, total=total, rate=rate,
        trend_arrow=trend_arrow, trend_label=trend_label, best_line=best_line,
    )
    return text, f"{APP_URL}/reports"
