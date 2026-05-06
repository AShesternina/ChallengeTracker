const TITLE_MAP: Record<string, Record<string, string>> = {
  "Morning Workout":  { ru: "Утренняя тренировка", en: "Morning Workout" },
  "Reading Habit":    { ru: "Привычка читать",      en: "Reading Habit" },
  "Meditation":       { ru: "Медитация",            en: "Meditation" },
  "Water Intake":     { ru: "Питьевой режим",       en: "Water Intake" },
  "No Sugar":         { ru: "Без сахара",           en: "No Sugar" },
};

const DESC_MAP: Record<string, Record<string, string>> = {
  "Daily morning exercise session":           { ru: "Ежедневная утренняя тренировка",               en: "Daily morning exercise session" },
  "Read every day to expand your knowledge":  { ru: "Читайте каждый день, чтобы расширять знания",  en: "Read every day to expand your knowledge" },
  "Daily mindfulness practice":               { ru: "Ежедневная практика осознанности",             en: "Daily mindfulness practice" },
  "Stay hydrated throughout the day":         { ru: "Пейте достаточно воды в течение дня",          en: "Stay hydrated throughout the day" },
  "Eliminate sugar from your diet":           { ru: "Исключите сахар из своего рациона",            en: "Eliminate sugar from your diet" },
};

export function translateTemplateName(title: string, lang: string): string {
  return TITLE_MAP[title]?.[lang] ?? title;
}

export function translateTemplateDesc(desc: string, lang: string): string {
  return DESC_MAP[desc]?.[lang] ?? desc;
}
