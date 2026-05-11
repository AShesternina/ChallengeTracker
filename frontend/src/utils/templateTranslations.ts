export type TemplateLang = "ru" | "en" | "es" | "pt";

// Category order for display
export const CATEGORY_ORDER = [
  "🥗 Health & Nutrition",
  "🏃 Sport",
  "📚 Education",
  "🧘 Mental Health",
  "💼 Productivity",
  "🧹 Home & Order",
  "💰 Finance",
  "🚫 Quit Habits",
  "❤️ Relationships",
];

export const CATEGORY_LABELS: Record<string, Record<TemplateLang, string>> = {
  "🥗 Health & Nutrition": { ru: "🥗 Здоровье и питание", en: "🥗 Health & Nutrition", es: "🥗 Salud y nutrición",    pt: "🥗 Saúde e nutrição" },
  "🏃 Sport":              { ru: "🏃 Спорт",              en: "🏃 Sport",              es: "🏃 Deporte",              pt: "🏃 Esporte" },
  "📚 Education":          { ru: "📚 Образование",         en: "📚 Education",          es: "📚 Educación",            pt: "📚 Educação" },
  "🧘 Mental Health":      { ru: "🧘 Ментальное здоровье", en: "🧘 Mental Health",      es: "🧘 Salud mental",         pt: "🧘 Saúde mental" },
  "💼 Productivity":       { ru: "💼 Продуктивность",      en: "💼 Productivity",       es: "💼 Productividad",        pt: "💼 Produtividade" },
  "🧹 Home & Order":       { ru: "🧹 Быт и порядок",       en: "🧹 Home & Order",       es: "🧹 Hogar y orden",        pt: "🧹 Casa e ordem" },
  "💰 Finance":            { ru: "💰 Финансы",             en: "💰 Finance",            es: "💰 Finanzas",             pt: "💰 Finanças" },
  "🚫 Quit Habits":        { ru: "🚫 Отказ от привычек",   en: "🚫 Quit Habits",        es: "🚫 Dejar hábitos",        pt: "🚫 Largar hábitos" },
  "❤️ Relationships":      { ru: "❤️ Отношения",           en: "❤️ Relationships",      es: "❤️ Relaciones",           pt: "❤️ Relacionamentos" },
};

// Maps English canonical title → category key
export const TEMPLATE_CATEGORY_MAP: Record<string, string> = {
  // Health & Nutrition
  "Daily Vitamins":          "🥗 Health & Nutrition",
  "Blood Pressure Check":    "🥗 Health & Nutrition",
  "8 Glasses of Water":      "🥗 Health & Nutrition",
  "Daily Vegetables":        "🥗 Health & Nutrition",
  // Sport
  "10,000 Steps":            "🏃 Sport",
  "Morning Workout":         "🏃 Sport",
  "Push-ups 3x Day":         "🏃 Sport",
  "Cold Shower":             "🏃 Sport",
  // Education
  "Read 20 Pages":           "📚 Education",
  "1 Course Lesson Daily":   "📚 Education",
  "Learn 20 Words":          "📚 Education",
  "Coding Practice":         "📚 Education",
  // Mental Health
  "Meditation":              "🧘 Mental Health",
  "Gratitude Journal":       "🧘 Mental Health",
  "Morning Pages":           "🧘 Mental Health",
  "Breathing Practice":      "🧘 Mental Health",
  // Productivity
  "Deep Work 2 Hours":       "💼 Productivity",
  "Daily Planning":          "💼 Productivity",
  "No Social Media Until Noon": "💼 Productivity",
  "3 Main Tasks":            "💼 Productivity",
  // Home & Order
  "15 Min Cleaning":         "🧹 Home & Order",
  "Clean Desk":              "🧹 Home & Order",
  "Declutter":               "🧹 Home & Order",
  "Minimalism 1 Item":       "🧹 Home & Order",
  // Finance
  "Daily Expense Tracking":  "💰 Finance",
  "No Spend Day":            "💰 Finance",
  "Daily Savings":           "💰 Finance",
  "Financial Journal":       "💰 Finance",
  // Quit Habits
  "No Alcohol":              "🚫 Quit Habits",
  "No Smoking":              "🚫 Quit Habits",
  "No Sugar":                "🚫 Quit Habits",
  "No Late Snacks":          "🚫 Quit Habits",
  // Relationships
  "Call Loved Ones":         "❤️ Relationships",
  "Family Time":             "❤️ Relationships",
  "Meet a Friend":           "❤️ Relationships",
  "Self-Care Day":           "❤️ Relationships",
};

const TITLE_MAP: Record<string, Record<TemplateLang, string>> = {
  // 🥗 Health & Nutrition
  "Daily Vitamins":          { ru: "Приём витаминов",          en: "Daily Vitamins",          es: "Vitaminas diarias",          pt: "Vitaminas diárias" },
  "Blood Pressure Check":    { ru: "Контроль давления",        en: "Blood Pressure Check",    es: "Control de presión",         pt: "Controle de pressão" },
  "8 Glasses of Water":      { ru: "8 стаканов воды",          en: "8 Glasses of Water",      es: "8 vasos de agua",            pt: "8 copos de água" },
  "Daily Vegetables":        { ru: "Овощи каждый день",        en: "Daily Vegetables",        es: "Verduras cada día",          pt: "Vegetais todo dia" },
  // 🏃 Sport
  "10,000 Steps":            { ru: "10 000 шагов",             en: "10,000 Steps",            es: "10.000 pasos",               pt: "10.000 passos" },
  "Morning Workout":         { ru: "Утренняя зарядка",         en: "Morning Workout",         es: "Entrenamiento matutino",     pt: "Treino matinal" },
  "Push-ups 3x Day":         { ru: "Отжимания 3×день",         en: "Push-ups 3x Day",         es: "Flexiones 3×día",            pt: "Flexões 3×dia" },
  "Cold Shower":             { ru: "Холодный душ",             en: "Cold Shower",             es: "Ducha fría",                 pt: "Banho frio" },
  // 📚 Education
  "Read 20 Pages":           { ru: "Читать 20 страниц",        en: "Read 20 Pages",           es: "Leer 20 páginas",            pt: "Ler 20 páginas" },
  "1 Course Lesson Daily":   { ru: "1 урок курса в день",      en: "1 Course Lesson Daily",   es: "1 lección de curso al día",  pt: "1 aula de curso por dia" },
  "Learn 20 Words":          { ru: "Учить 20 слов в день",     en: "Learn 20 Words",          es: "Aprender 20 palabras",       pt: "Aprender 20 palavras" },
  "Coding Practice":         { ru: "Практика программирования",en: "Coding Practice",         es: "Práctica de programación",   pt: "Prática de programação" },
  // 🧘 Mental Health
  "Meditation":              { ru: "Медитация 10 минут",       en: "Meditation",              es: "Meditación",                 pt: "Meditação" },
  "Gratitude Journal":       { ru: "Дневник благодарности",    en: "Gratitude Journal",       es: "Diario de gratitud",         pt: "Diário de gratidão" },
  "Morning Pages":           { ru: "Утренние страницы",        en: "Morning Pages",           es: "Páginas matutinas",          pt: "Páginas matinais" },
  "Breathing Practice":      { ru: "Дыхательная практика",     en: "Breathing Practice",      es: "Práctica de respiración",    pt: "Prática de respiração" },
  // 💼 Productivity
  "Deep Work 2 Hours":       { ru: "Deep Work 2 часа",         en: "Deep Work 2 Hours",       es: "Trabajo profundo 2 horas",   pt: "Trabalho profundo 2 horas" },
  "Daily Planning":          { ru: "Планирование дня",         en: "Daily Planning",          es: "Planificación diaria",       pt: "Planejamento diário" },
  "No Social Media Until Noon": { ru: "Без соцсетей до полудня", en: "No Social Media Until Noon", es: "Sin redes hasta el mediodía", pt: "Sem redes até o meio-dia" },
  "3 Main Tasks":            { ru: "3 главные задачи",         en: "3 Main Tasks",            es: "3 tareas principales",       pt: "3 tarefas principais" },
  // 🧹 Home & Order
  "15 Min Cleaning":         { ru: "Уборка 15 минут",          en: "15 Min Cleaning",         es: "Limpieza 15 minutos",        pt: "Limpeza 15 minutos" },
  "Clean Desk":              { ru: "Чистый стол",              en: "Clean Desk",              es: "Escritorio limpio",          pt: "Mesa limpa" },
  "Declutter":               { ru: "Разбор вещей",             en: "Declutter",               es: "Ordenar cosas",              pt: "Organizar coisas" },
  "Minimalism 1 Item":       { ru: "Минимализм: 1 вещь",       en: "Minimalism 1 Item",       es: "Minimalismo: 1 cosa",        pt: "Minimalismo: 1 item" },
  // 💰 Finance
  "Daily Expense Tracking":  { ru: "Учёт расходов",            en: "Daily Expense Tracking",  es: "Control de gastos",          pt: "Controle de gastos" },
  "No Spend Day":            { ru: "День без трат",             en: "No Spend Day",            es: "Día sin gastos",             pt: "Dia sem gastos" },
  "Daily Savings":           { ru: "Откладывать деньги",        en: "Daily Savings",           es: "Ahorro diario",              pt: "Poupança diária" },
  "Financial Journal":       { ru: "Финансовый дневник",        en: "Financial Journal",       es: "Diario financiero",          pt: "Diário financeiro" },
  // 🚫 Quit Habits
  "No Alcohol":              { ru: "Без алкоголя",             en: "No Alcohol",              es: "Sin alcohol",                pt: "Sem álcool" },
  "No Smoking":              { ru: "Без курения",              en: "No Smoking",              es: "Sin fumar",                  pt: "Sem fumar" },
  "No Sugar":                { ru: "Без сахара",               en: "No Sugar",                es: "Sin azúcar",                 pt: "Sem açúcar" },
  "No Late Snacks":          { ru: "Без поздних перекусов",    en: "No Late Snacks",          es: "Sin meriendas tardías",      pt: "Sem lanches noturnos" },
  // ❤️ Relationships
  "Call Loved Ones":         { ru: "Звонок близким",           en: "Call Loved Ones",         es: "Llamar a seres queridos",    pt: "Ligar para entes queridos" },
  "Family Time":             { ru: "Время с семьёй",           en: "Family Time",             es: "Tiempo en familia",          pt: "Tempo em família" },
  "Meet a Friend":           { ru: "Встреча с другом",         en: "Meet a Friend",           es: "Quedar con un amigo",        pt: "Encontrar um amigo" },
  "Self-Care Day":           { ru: "День заботы о себе",       en: "Self-Care Day",           es: "Día de autocuidado",         pt: "Dia de autocuidado" },
};

const DESC_MAP: Record<string, Record<TemplateLang, string>> = {
  // Health & Nutrition
  "Take your vitamins morning and evening":
    { ru: "Принимайте витамины утром и вечером", en: "Take your vitamins morning and evening", es: "Toma tus vitaminas por la mañana y por la noche", pt: "Tome suas vitaminas de manhã e à noite" },
  "Track your blood pressure 3 times a day":
    { ru: "Измеряйте давление 3 раза в день", en: "Track your blood pressure 3 times a day", es: "Controla tu presión arterial 3 veces al día", pt: "Monitore sua pressão arterial 3 vezes ao dia" },
  "Stay hydrated throughout the day":
    { ru: "Пейте достаточно воды в течение дня", en: "Stay hydrated throughout the day", es: "Mantente hidratado durante todo el día", pt: "Mantenha-se hidratado durante todo o dia" },
  "Eat vegetables every day — your body will thank you":
    { ru: "Ешьте овощи каждый день — ваш организм скажет спасибо", en: "Eat vegetables every day — your body will thank you", es: "Come verduras cada día — tu cuerpo te lo agradecerá", pt: "Coma vegetais todo dia — seu corpo vai agradecer" },
  // Sport
  "Walk at least 10,000 steps every day":
    { ru: "Проходите не менее 10 000 шагов каждый день", en: "Walk at least 10,000 steps every day", es: "Camina al menos 10.000 pasos cada día", pt: "Caminhe pelo menos 10.000 passos todos os dias" },
  "Daily morning exercise session":
    { ru: "Ежедневная утренняя тренировка", en: "Daily morning exercise session", es: "Sesión de ejercicio matutino diario", pt: "Sessão de exercício matinal diária" },
  "Build upper body strength with daily push-up sets":
    { ru: "Укрепляйте тело ежедневными подходами", en: "Build upper body strength with daily push-up sets", es: "Fortalece el tren superior con series de flexiones", pt: "Fortaleça o corpo com séries diárias de flexões" },
  "Start your day with a cold shower for energy and resilience":
    { ru: "Начинайте день с холодного душа для бодрости", en: "Start your day with a cold shower for energy and resilience", es: "Empieza el día con una ducha fría para tener energía", pt: "Comece o dia com um banho frio para ter energia" },
  // Education
  "Read at least 20 pages every day":
    { ru: "Читайте не менее 20 страниц каждый день", en: "Read at least 20 pages every day", es: "Lee al menos 20 páginas cada día", pt: "Leia pelo menos 20 páginas todos os dias" },
  "Complete one lesson of your online course every day":
    { ru: "Проходите один урок онлайн-курса каждый день", en: "Complete one lesson of your online course every day", es: "Completa una lección de tu curso en línea cada día", pt: "Complete uma aula do seu curso online todos os dias" },
  "Learn 20 new words in a foreign language every day":
    { ru: "Учите 20 новых слов на иностранном языке каждый день", en: "Learn 20 new words in a foreign language every day", es: "Aprende 20 palabras nuevas en un idioma extranjero cada día", pt: "Aprenda 20 palavras novas em um idioma estrangeiro todos os dias" },
  "Practice coding for at least 30 minutes every day":
    { ru: "Практикуйте программирование не менее 30 минут каждый день", en: "Practice coding for at least 30 minutes every day", es: "Practica programación durante al menos 30 minutos cada día", pt: "Pratique programação por pelo menos 30 minutos todos os dias" },
  // Mental Health
  "Daily mindfulness practice":
    { ru: "Ежедневная практика осознанности", en: "Daily mindfulness practice", es: "Práctica diaria de atención plena", pt: "Prática diária de atenção plena" },
  "Write down 3 things you are grateful for today":
    { ru: "Запишите 3 вещи, за которые вы благодарны сегодня", en: "Write down 3 things you are grateful for today", es: "Anota 3 cosas por las que estás agradecido hoy", pt: "Anote 3 coisas pelas quais você é grato hoje" },
  "Write 3 pages by hand right after waking up":
    { ru: "Пишите 3 страницы от руки сразу после пробуждения", en: "Write 3 pages by hand right after waking up", es: "Escribe 3 páginas a mano justo al despertar", pt: "Escreva 3 páginas à mão logo ao acordar" },
  "Calm your mind with breathing exercises":
    { ru: "Успокойте разум дыхательными упражнениями", en: "Calm your mind with breathing exercises", es: "Calma tu mente con ejercicios de respiración", pt: "Acalme sua mente com exercícios de respiração" },
  // Productivity
  "Work with full focus for 2 hours without distractions":
    { ru: "Работайте с полным фокусом 2 часа без отвлечений", en: "Work with full focus for 2 hours without distractions", es: "Trabaja con total enfoque durante 2 horas sin distracciones", pt: "Trabalhe com foco total por 2 horas sem distrações" },
  "Plan tomorrow every evening — 10 minutes for a better day":
    { ru: "Планируйте завтра каждый вечер — 10 минут для лучшего дня", en: "Plan tomorrow every evening — 10 minutes for a better day", es: "Planifica mañana cada noche — 10 minutos para un mejor día", pt: "Planeje amanhã toda noite — 10 minutos para um dia melhor" },
  "Keep your mornings free from social media":
    { ru: "Оставляйте утро свободным от соцсетей", en: "Keep your mornings free from social media", es: "Mantén tus mañanas libres de redes sociales", pt: "Mantenha suas manhãs livres das redes sociais" },
  "Pick 3 most important tasks every morning and complete them":
    { ru: "Выбирайте 3 самые важные задачи каждое утро и выполняйте их", en: "Pick 3 most important tasks every morning and complete them", es: "Elige 3 tareas más importantes cada mañana y complétalas", pt: "Escolha 3 tarefas mais importantes toda manhã e conclua-as" },
  // Home & Order
  "Spend 15 minutes cleaning every day — small steps, big results":
    { ru: "Посвящайте 15 минут уборке каждый день — маленькие шаги, большой результат", en: "Spend 15 minutes cleaning every day — small steps, big results", es: "Dedica 15 minutos a limpiar cada día — pequeños pasos, grandes resultados", pt: "Dedique 15 minutos para limpar todo dia — pequenos passos, grandes resultados" },
  "Keep your desk clean every evening before bed":
    { ru: "Держите стол чистым каждый вечер перед сном", en: "Keep your desk clean every evening before bed", es: "Mantén tu escritorio limpio cada noche antes de dormir", pt: "Mantenha sua mesa limpa toda noite antes de dormir" },
  "Find one thing to throw away, donate, or organize every day":
    { ru: "Находите одну вещь, чтобы выбросить, отдать или разобрать каждый день", en: "Find one thing to throw away, donate, or organize every day", es: "Encuentra una cosa para tirar, donar u organizar cada día", pt: "Encontre uma coisa para jogar fora, doar ou organizar todo dia" },
  "Let go of one unnecessary item every day":
    { ru: "Избавляйтесь от одной ненужной вещи каждый день", en: "Let go of one unnecessary item every day", es: "Deshaz de un artículo innecesario cada día", pt: "Livre-se de um item desnecessário todo dia" },
  // Finance
  "Log all your expenses every evening":
    { ru: "Записывайте все расходы каждый вечер", en: "Log all your expenses every evening", es: "Registra todos tus gastos cada noche", pt: "Registre todos os seus gastos toda noite" },
  "Spend no money today — practice financial discipline":
    { ru: "Не тратьте деньги сегодня — практикуйте финансовую дисциплину", en: "Spend no money today — practice financial discipline", es: "No gastes dinero hoy — practica la disciplina financiera", pt: "Não gaste dinheiro hoje — pratique a disciplina financeira" },
  "Set aside a fixed amount every day — build your safety net":
    { ru: "Откладывайте фиксированную сумму каждый день — создавайте подушку безопасности", en: "Set aside a fixed amount every day — build your safety net", es: "Reserva una cantidad fija cada día — crea tu colchón financiero", pt: "Reserve uma quantia fixa todo dia — construa sua reserva de emergência" },
  "Write down your financial goals and progress every day":
    { ru: "Записывайте свои финансовые цели и прогресс каждый день", en: "Write down your financial goals and progress every day", es: "Anota tus metas financieras y progreso cada día", pt: "Anote suas metas financeiras e progresso todo dia" },
  // Quit Habits
  "Stay alcohol-free — every sober day counts":
    { ru: "Оставайтесь трезвыми — каждый день без алкоголя важен", en: "Stay alcohol-free — every sober day counts", es: "Mantente sin alcohol — cada día sobrio cuenta", pt: "Fique sem álcool — cada dia sóbrio conta" },
  "Quit smoking — your lungs will start recovering in 24 hours":
    { ru: "Бросьте курить — ваши лёгкие начнут восстанавливаться через 24 часа", en: "Quit smoking — your lungs will start recovering in 24 hours", es: "Deja de fumar — tus pulmones comenzarán a recuperarse en 24 horas", pt: "Pare de fumar — seus pulmões começarão a se recuperar em 24 horas" },
  "Avoid sugar for the whole day":
    { ru: "Избегайте сахара в течение всего дня", en: "Avoid sugar for the whole day", es: "Evita el azúcar durante todo el día", pt: "Evite açúcar durante todo o dia" },
  "Stop eating after 8pm — better sleep and metabolism":
    { ru: "Перестаньте есть после 20:00 — лучший сон и метаболизм", en: "Stop eating after 8pm — better sleep and metabolism", es: "Deja de comer después de las 20:00 — mejor sueño y metabolismo", pt: "Pare de comer após as 20h — melhor sono e metabolismo" },
  // Relationships
  "Call a family member or close friend every day":
    { ru: "Позвоните члену семьи или близкому другу каждый день", en: "Call a family member or close friend every day", es: "Llama a un familiar o amigo cercano cada día", pt: "Ligue para um familiar ou amigo próximo todo dia" },
  "Spend quality time with family — phones away":
    { ru: "Проводите качественное время с семьёй — телефоны в сторону", en: "Spend quality time with family — phones away", es: "Pasa tiempo de calidad con la familia — sin teléfonos", pt: "Passe tempo de qualidade com a família — sem celulares" },
  "Meet or meaningfully connect with a friend every day":
    { ru: "Встречайтесь или общайтесь по-настоящему с другом каждый день", en: "Meet or meaningfully connect with a friend every day", es: "Reúnete o conecta de manera significativa con un amigo cada día", pt: "Encontre ou conecte-se de forma significativa com um amigo todo dia" },
  "Do something just for yourself — you deserve it":
    { ru: "Сделайте что-то только для себя — вы заслуживаете этого", en: "Do something just for yourself — you deserve it", es: "Haz algo solo para ti — te lo mereces", pt: "Faça algo só para você — você merece" },
};

function toLang(lang: string): TemplateLang {
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("pt")) return "pt";
  return "en";
}

export function translateTemplateName(title: string, lang: string): string {
  return TITLE_MAP[title]?.[toLang(lang)] ?? title;
}

export function translateTemplateDesc(desc: string, lang: string): string {
  return DESC_MAP[desc]?.[toLang(lang)] ?? desc;
}

export function getTemplateCategoryKey(title: string): string {
  return TEMPLATE_CATEGORY_MAP[title] ?? "";
}

export function getTemplateCategory(title: string, lang: string): string {
  const key = getTemplateCategoryKey(title);
  if (!key) return "";
  return CATEGORY_LABELS[key]?.[toLang(lang)] ?? key;
}

export function translateCategoryLabel(key: string, lang: string): string {
  return CATEGORY_LABELS[key]?.[toLang(lang)] ?? key;
}

export const SLUG_TO_TITLE: Record<string, string> = {
  // Health & Nutrition
  "daily-vitamins":          "Daily Vitamins",
  "blood-pressure-check":    "Blood Pressure Check",
  "8-glasses-of-water":      "8 Glasses of Water",
  "daily-vegetables":        "Daily Vegetables",
  // Sport
  "10000-steps":             "10,000 Steps",
  "morning-workout":         "Morning Workout",
  "push-ups-3x-day":         "Push-ups 3x Day",
  "cold-shower":             "Cold Shower",
  // Education
  "read-20-pages":           "Read 20 Pages",
  "1-course-lesson-daily":   "1 Course Lesson Daily",
  "learn-20-words":          "Learn 20 Words",
  "coding-practice":         "Coding Practice",
  // Mental Health
  "meditation":              "Meditation",
  "gratitude-journal":       "Gratitude Journal",
  "morning-pages":           "Morning Pages",
  "breathing-practice":      "Breathing Practice",
  // Productivity
  "deep-work-2-hours":       "Deep Work 2 Hours",
  "daily-planning":          "Daily Planning",
  "no-social-media-until-noon": "No Social Media Until Noon",
  "3-main-tasks":            "3 Main Tasks",
  // Home & Order
  "15-min-cleaning":         "15 Min Cleaning",
  "clean-desk":              "Clean Desk",
  "declutter":               "Declutter",
  "minimalism-1-item":       "Minimalism 1 Item",
  // Finance
  "daily-expense-tracking":  "Daily Expense Tracking",
  "no-spend-day":            "No Spend Day",
  "daily-savings":           "Daily Savings",
  "financial-journal":       "Financial Journal",
  // Quit Habits
  "no-alcohol":              "No Alcohol",
  "no-smoking":              "No Smoking",
  "no-sugar":                "No Sugar",
  "no-late-snacks":          "No Late Snacks",
  // Relationships
  "call-loved-ones":         "Call Loved Ones",
  "family-time":             "Family Time",
  "meet-a-friend":           "Meet a Friend",
  "self-care-day":           "Self-Care Day",
};
