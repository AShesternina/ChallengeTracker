export type TemplateLang = "ru" | "en";

const TITLE_MAP: Record<string, Record<TemplateLang, string>> = {
  // Здоровье
  "Healthy Sleep":              { ru: "Здоровый сон",              en: "Healthy Sleep" },
  "8 Glasses of Water":         { ru: "Правило 8 стаканов",        en: "8 Glasses of Water" },
  "Daily Vitamins":             { ru: "Приём витаминов",            en: "Daily Vitamins" },
  "No Sugar":                   { ru: "Без сахара",                en: "No Sugar" },
  // Продуктивность
  "Morning Pages":              { ru: "Утренние страницы",          en: "Morning Pages" },
  "Pomodoro Method":            { ru: "Метод Помидора",             en: "Pomodoro Method" },
  "No Social Media Until Noon": { ru: "Без соцсетей до полудня",   en: "No Social Media Until Noon" },
  "Evening Review":             { ru: "Вечерняя рефлексия",         en: "Evening Review" },
  // Спорт
  "Morning Workout":            { ru: "Утренняя тренировка",        en: "Morning Workout" },
  "Push-ups 3x Day":            { ru: "Отжимания 3×день",          en: "Push-ups 3x Day" },
  "10,000 Steps":               { ru: "10 000 шагов",              en: "10,000 Steps" },
  "Cold Shower":                { ru: "Холодный душ",              en: "Cold Shower" },
  // Ментальное здоровье
  "Meditation":                 { ru: "Медитация",                 en: "Meditation" },
  "Breathing Practice":         { ru: "Дыхательная практика",      en: "Breathing Practice" },
  "Gratitude Journal":          { ru: "Дневник благодарности",     en: "Gratitude Journal" },
  "Phone-Free Evening":         { ru: "Вечер без телефона",        en: "Phone-Free Evening" },
};

const DESC_MAP: Record<string, Record<TemplateLang, string>> = {
  "Go to bed on time every night":                           { ru: "Ложитесь спать вовремя каждую ночь",                   en: "Go to bed on time every night" },
  "Stay hydrated throughout the day":                        { ru: "Пейте достаточно воды в течение дня",                  en: "Stay hydrated throughout the day" },
  "Take your vitamins morning and evening":                  { ru: "Принимайте витамины утром и вечером",                  en: "Take your vitamins morning and evening" },
  "Avoid sugar for the whole day":                           { ru: "Избегайте сахара в течение всего дня",                 en: "Avoid sugar for the whole day" },
  "Write 3 pages by hand right after waking up":            { ru: "Пишите 3 страницы от руки сразу после пробуждения",   en: "Write 3 pages by hand right after waking up" },
  "Work in focused 25-minute sessions":                      { ru: "Работайте сфокусированными 25-минутными сессиями",    en: "Work in focused 25-minute sessions" },
  "Keep your mornings free from social media":               { ru: "Оставляйте утро свободным от соцсетей",               en: "Keep your mornings free from social media" },
  "Reflect on your day: wins, lessons, tomorrow's focus":    { ru: "Итоги дня: достижения, уроки, план на завтра",         en: "Reflect on your day: wins, lessons, tomorrow's focus" },
  "Daily morning exercise session":                          { ru: "Ежедневная утренняя тренировка",                       en: "Daily morning exercise session" },
  "Build upper body strength with daily push-up sets":       { ru: "Укрепляйте тело ежедневными подходами",               en: "Build upper body strength with daily push-up sets" },
  "Walk at least 10,000 steps every day":                    { ru: "Проходите не менее 10 000 шагов каждый день",         en: "Walk at least 10,000 steps every day" },
  "Start your day with a cold shower for energy and resilience": { ru: "Начинайте день с холодного душа для бодрости",    en: "Start your day with a cold shower for energy and resilience" },
  "Daily mindfulness practice":                              { ru: "Ежедневная практика осознанности",                    en: "Daily mindfulness practice" },
  "Calm your mind with breathing exercises":                 { ru: "Успокойте разум дыхательными упражнениями",           en: "Calm your mind with breathing exercises" },
  "Write down 3 things you are grateful for today":          { ru: "Запишите 3 вещи, за которые вы благодарны сегодня",   en: "Write down 3 things you are grateful for today" },
  "No phone for one hour before bed — better sleep guaranteed": { ru: "Час без телефона перед сном — для лучшего сна",    en: "No phone for one hour before bed — better sleep guaranteed" },
};

export const TEMPLATE_CATEGORIES: Record<string, Record<TemplateLang, string>> = {
  "Healthy Sleep":              { ru: "💊 Здоровье",             en: "💊 Health" },
  "8 Glasses of Water":         { ru: "💊 Здоровье",             en: "💊 Health" },
  "Daily Vitamins":             { ru: "💊 Здоровье",             en: "💊 Health" },
  "No Sugar":                   { ru: "💊 Здоровье",             en: "💊 Health" },
  "Morning Pages":              { ru: "📈 Продуктивность",        en: "📈 Productivity" },
  "Pomodoro Method":            { ru: "📈 Продуктивность",        en: "📈 Productivity" },
  "No Social Media Until Noon": { ru: "📈 Продуктивность",        en: "📈 Productivity" },
  "Evening Review":             { ru: "📈 Продуктивность",        en: "📈 Productivity" },
  "Morning Workout":            { ru: "🏃 Спорт",                en: "🏃 Sport" },
  "Push-ups 3x Day":            { ru: "🏃 Спорт",                en: "🏃 Sport" },
  "10,000 Steps":               { ru: "🏃 Спорт",                en: "🏃 Sport" },
  "Cold Shower":                { ru: "🏃 Спорт",                en: "🏃 Sport" },
  "Meditation":                 { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health" },
  "Breathing Practice":         { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health" },
  "Gratitude Journal":          { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health" },
  "Phone-Free Evening":         { ru: "🧘 Ментальное здоровье",   en: "🧘 Mental Health" },
};

function toLang(lang: string): TemplateLang {
  return lang.startsWith("ru") ? "ru" : "en";
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
