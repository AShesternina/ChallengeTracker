const TITLE_MAP: Record<string, Record<string, string>> = {
  // Здоровье
  "Healthy Sleep":       { ru: "Здоровый сон",          en: "Healthy Sleep" },
  "8 Glasses of Water":  { ru: "Правило 8 стаканов",    en: "8 Glasses of Water" },
  "Daily Vitamins":      { ru: "Приём витаминов",        en: "Daily Vitamins" },
  "No Sugar":            { ru: "Без сахара",             en: "No Sugar" },
  // Продуктивность
  "Morning Pages":       { ru: "Утренние страницы",      en: "Morning Pages" },
  "Pomodoro Method":     { ru: "Метод Помидора",         en: "Pomodoro Method" },
  "No Social Media Until Noon": { ru: "Без соцсетей до полудня", en: "No Social Media Until Noon" },
  // Спорт
  "Morning Workout":     { ru: "Утренняя тренировка",   en: "Morning Workout" },
  "Push-ups 3x Day":     { ru: "Отжимания 3×день",      en: "Push-ups 3x Day" },
  "10,000 Steps":        { ru: "10 000 шагов",           en: "10,000 Steps" },
  // Ментальное здоровье
  "Meditation":          { ru: "Медитация",              en: "Meditation" },
  "Breathing Practice":  { ru: "Дыхательная практика",  en: "Breathing Practice" },
  "Gratitude Journal":   { ru: "Дневник благодарности", en: "Gratitude Journal" },
};

const DESC_MAP: Record<string, Record<string, string>> = {
  "Go to bed on time every night":                    { ru: "Ложитесь спать вовремя каждую ночь",                 en: "Go to bed on time every night" },
  "Stay hydrated throughout the day":                 { ru: "Пейте достаточно воды в течение дня",                en: "Stay hydrated throughout the day" },
  "Take your vitamins morning and evening":           { ru: "Принимайте витамины утром и вечером",                en: "Take your vitamins morning and evening" },
  "Avoid sugar for the whole day":                    { ru: "Избегайте сахара в течение всего дня",               en: "Avoid sugar for the whole day" },
  "Write 3 pages by hand right after waking up":     { ru: "Пишите 3 страницы от руки сразу после пробуждения", en: "Write 3 pages by hand right after waking up" },
  "Work in focused 25-minute sessions":               { ru: "Работайте сфокусированными 25-минутными сессиями",  en: "Work in focused 25-minute sessions" },
  "Keep your mornings free from social media":        { ru: "Оставляйте утро свободным от соцсетей",             en: "Keep your mornings free from social media" },
  "Daily morning exercise session":                   { ru: "Ежедневная утренняя тренировка",                     en: "Daily morning exercise session" },
  "Build upper body strength with daily push-up sets": { ru: "Укрепляйте верхнюю часть тела ежедневными подходами", en: "Build upper body strength with daily push-up sets" },
  "Walk at least 10,000 steps every day":             { ru: "Проходите не менее 10 000 шагов каждый день",       en: "Walk at least 10,000 steps every day" },
  "Daily mindfulness practice":                       { ru: "Ежедневная практика осознанности",                  en: "Daily mindfulness practice" },
  "Calm your mind with breathing exercises":          { ru: "Успокойте разум с помощью дыхательных упражнений",  en: "Calm your mind with breathing exercises" },
  "Write down 3 things you are grateful for today":   { ru: "Запишите 3 вещи, за которые вы благодарны сегодня", en: "Write down 3 things you are grateful for today" },
};

export function translateTemplateName(title: string, lang: string): string {
  return TITLE_MAP[title]?.[lang] ?? title;
}

export function translateTemplateDesc(desc: string, lang: string): string {
  return DESC_MAP[desc]?.[lang] ?? desc;
}
