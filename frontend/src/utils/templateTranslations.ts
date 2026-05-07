export type TemplateLang = "ru" | "en" | "es" | "pt";

const TITLE_MAP: Record<string, Record<TemplateLang, string>> = {
  // Здоровье / Health
  "Healthy Sleep":              { ru: "Здоровый сон",              en: "Healthy Sleep",            es: "Dormir bien",          pt: "Dormir bem" },
  "8 Glasses of Water":         { ru: "Правило 8 стаканов",        en: "8 Glasses of Water",       es: "8 vasos de agua",      pt: "8 copos de água" },
  "Daily Vitamins":             { ru: "Приём витаминов",            en: "Daily Vitamins",           es: "Vitaminas diarias",    pt: "Vitaminas diárias" },
  "No Sugar":                   { ru: "Без сахара",                en: "No Sugar",                 es: "Sin azúcar",           pt: "Sem açúcar" },
  // Продуктивность / Productivity
  "Morning Pages":              { ru: "Утренние страницы",          en: "Morning Pages",            es: "Páginas matutinas",    pt: "Páginas matinais" },
  "Pomodoro Method":            { ru: "Метод Помидора",             en: "Pomodoro Method",          es: "Método Pomodoro",      pt: "Método Pomodoro" },
  "No Social Media Until Noon": { ru: "Без соцсетей до полудня",   en: "No Social Media Until Noon", es: "Sin redes hasta el mediodía", pt: "Sem redes até o meio-dia" },
  "Evening Review":             { ru: "Вечерняя рефлексия",         en: "Evening Review",           es: "Revisión nocturna",    pt: "Revisão noturna" },
  // Спорт / Sport
  "Morning Workout":            { ru: "Утренняя тренировка",        en: "Morning Workout",          es: "Entrenamiento matutino", pt: "Treino matinal" },
  "Push-ups 3x Day":            { ru: "Отжимания 3×день",          en: "Push-ups 3x Day",          es: "Flexiones 3×día",      pt: "Flexões 3×dia" },
  "10,000 Steps":               { ru: "10 000 шагов",              en: "10,000 Steps",             es: "10.000 pasos",         pt: "10.000 passos" },
  "Cold Shower":                { ru: "Холодный душ",              en: "Cold Shower",              es: "Ducha fría",           pt: "Banho frio" },
  // Ментальное здоровье / Mental Health
  "Meditation":                 { ru: "Медитация",                 en: "Meditation",               es: "Meditación",           pt: "Meditação" },
  "Breathing Practice":         { ru: "Дыхательная практика",      en: "Breathing Practice",       es: "Práctica de respiración", pt: "Prática de respiração" },
  "Gratitude Journal":          { ru: "Дневник благодарности",     en: "Gratitude Journal",        es: "Diario de gratitud",   pt: "Diário de gratidão" },
  "Phone-Free Evening":         { ru: "Вечер без телефона",        en: "Phone-Free Evening",       es: "Tarde sin teléfono",   pt: "Tarde sem celular" },
};

const DESC_MAP: Record<string, Record<TemplateLang, string>> = {
  "Go to bed on time every night":
    { ru: "Ложитесь спать вовремя каждую ночь",                   en: "Go to bed on time every night",                         es: "Acuéstate a tiempo cada noche",                      pt: "Vá dormir na hora certa toda noite" },
  "Stay hydrated throughout the day":
    { ru: "Пейте достаточно воды в течение дня",                  en: "Stay hydrated throughout the day",                      es: "Mantente hidratado durante todo el día",             pt: "Mantenha-se hidratado durante todo o dia" },
  "Take your vitamins morning and evening":
    { ru: "Принимайте витамины утром и вечером",                  en: "Take your vitamins morning and evening",                 es: "Toma tus vitaminas por la mañana y por la noche",    pt: "Tome suas vitaminas de manhã e à noite" },
  "Avoid sugar for the whole day":
    { ru: "Избегайте сахара в течение всего дня",                 en: "Avoid sugar for the whole day",                         es: "Evita el azúcar durante todo el día",                pt: "Evite açúcar durante todo o dia" },
  "Write 3 pages by hand right after waking up":
    { ru: "Пишите 3 страницы от руки сразу после пробуждения",   en: "Write 3 pages by hand right after waking up",           es: "Escribe 3 páginas a mano justo al despertar",        pt: "Escreva 3 páginas à mão logo ao acordar" },
  "Work in focused 25-minute sessions":
    { ru: "Работайте сфокусированными 25-минутными сессиями",    en: "Work in focused 25-minute sessions",                    es: "Trabaja en sesiones enfocadas de 25 minutos",        pt: "Trabalhe em sessões focadas de 25 minutos" },
  "Keep your mornings free from social media":
    { ru: "Оставляйте утро свободным от соцсетей",               en: "Keep your mornings free from social media",             es: "Mantén tus mañanas libres de redes sociales",        pt: "Mantenha suas manhãs livres das redes sociais" },
  "Reflect on your day: wins, lessons, tomorrow's focus":
    { ru: "Итоги дня: достижения, уроки, план на завтра",         en: "Reflect on your day: wins, lessons, tomorrow's focus",  es: "Reflexiona sobre tu día: logros, lecciones, mañana", pt: "Reflita sobre seu dia: conquistas, lições, amanhã" },
  "Daily morning exercise session":
    { ru: "Ежедневная утренняя тренировка",                       en: "Daily morning exercise session",                        es: "Sesión de ejercicio matutino diario",                pt: "Sessão de exercício matinal diária" },
  "Build upper body strength with daily push-up sets":
    { ru: "Укрепляйте тело ежедневными подходами",               en: "Build upper body strength with daily push-up sets",     es: "Fortalece el tren superior con series de flexiones",  pt: "Fortaleça o corpo com séries diárias de flexões" },
  "Walk at least 10,000 steps every day":
    { ru: "Проходите не менее 10 000 шагов каждый день",         en: "Walk at least 10,000 steps every day",                  es: "Camina al menos 10.000 pasos cada día",              pt: "Caminhe pelo menos 10.000 passos todos os dias" },
  "Start your day with a cold shower for energy and resilience":
    { ru: "Начинайте день с холодного душа для бодрости",        en: "Start your day with a cold shower for energy and resilience", es: "Empieza el día con una ducha fría para tener energía", pt: "Comece o dia com um banho frio para ter energia" },
  "Daily mindfulness practice":
    { ru: "Ежедневная практика осознанности",                    en: "Daily mindfulness practice",                            es: "Práctica diaria de atención plena",                  pt: "Prática diária de atenção plena" },
  "Calm your mind with breathing exercises":
    { ru: "Успокойте разум дыхательными упражнениями",           en: "Calm your mind with breathing exercises",               es: "Calma tu mente con ejercicios de respiración",       pt: "Acalme sua mente com exercícios de respiração" },
  "Write down 3 things you are grateful for today":
    { ru: "Запишите 3 вещи, за которые вы благодарны сегодня",   en: "Write down 3 things you are grateful for today",        es: "Anota 3 cosas por las que estás agradecido hoy",     pt: "Anote 3 coisas pelas quais você é grato hoje" },
  "No phone for one hour before bed — better sleep guaranteed":
    { ru: "Час без телефона перед сном — для лучшего сна",       en: "No phone for one hour before bed — better sleep guaranteed", es: "Sin teléfono una hora antes de dormir",              pt: "Sem celular uma hora antes de dormir" },
};

export const TEMPLATE_CATEGORIES: Record<string, Record<TemplateLang, string>> = {
  "Healthy Sleep":              { ru: "💊 Здоровье",             en: "💊 Health",         es: "💊 Salud",           pt: "💊 Saúde" },
  "8 Glasses of Water":         { ru: "💊 Здоровье",             en: "💊 Health",         es: "💊 Salud",           pt: "💊 Saúde" },
  "Daily Vitamins":             { ru: "💊 Здоровье",             en: "💊 Health",         es: "💊 Salud",           pt: "💊 Saúde" },
  "No Sugar":                   { ru: "💊 Здоровье",             en: "💊 Health",         es: "💊 Salud",           pt: "💊 Saúde" },
  "Morning Pages":              { ru: "📈 Продуктивность",        en: "📈 Productivity",   es: "📈 Productividad",   pt: "📈 Produtividade" },
  "Pomodoro Method":            { ru: "📈 Продуктивность",        en: "📈 Productivity",   es: "📈 Productividad",   pt: "📈 Produtividade" },
  "No Social Media Until Noon": { ru: "📈 Продуктивность",        en: "📈 Productivity",   es: "📈 Productividad",   pt: "📈 Produtividade" },
  "Evening Review":             { ru: "📈 Продуктивность",        en: "📈 Productivity",   es: "📈 Productividad",   pt: "📈 Produtividade" },
  "Morning Workout":            { ru: "🏃 Спорт",                en: "🏃 Sport",          es: "🏃 Deporte",         pt: "🏃 Esporte" },
  "Push-ups 3x Day":            { ru: "🏃 Спорт",                en: "🏃 Sport",          es: "🏃 Deporte",         pt: "🏃 Esporte" },
  "10,000 Steps":               { ru: "🏃 Спорт",                en: "🏃 Sport",          es: "🏃 Deporte",         pt: "🏃 Esporte" },
  "Cold Shower":                { ru: "🏃 Спорт",                en: "🏃 Sport",          es: "🏃 Deporte",         pt: "🏃 Esporte" },
  "Meditation":                 { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health",  es: "🧘 Salud mental",    pt: "🧘 Saúde mental" },
  "Breathing Practice":         { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health",  es: "🧘 Salud mental",    pt: "🧘 Saúde mental" },
  "Gratitude Journal":          { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health",  es: "🧘 Salud mental",    pt: "🧘 Saúde mental" },
  "Phone-Free Evening":         { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health",  es: "🧘 Salud mental",    pt: "🧘 Saúde mental" },
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

export function getTemplateCategory(title: string, lang: string): string {
  return TEMPLATE_CATEGORIES[title]?.[toLang(lang)] ?? "";
}
