export type Category = "workout" | "water" | "reading" | "meditation" | "nosugar" | "sleep" | "productivity" | "mental" | "default";

const KEYWORDS: Record<Category, string[]> = {
  workout:      ["workout", "exercise", "run", "sport", "gym", "push", "squat", "step", "walk",
                 "тренировк", "бег", "спорт", "зарядк", "отжим", "шаг", "прогулк", "фитнес"],
  water:        ["water", "drink", "hydrat", "glass", "стакан", "вода", "пить", "гидрат"],
  reading:      ["read", "book", "page", "journal", "write", "writ", "diary",
                 "чтен", "книг", "страниц", "дневник", "пис"],
  meditation:   ["meditat", "mindful", "breath", "calm", "релакс",
                 "медитац", "дыхан", "осознан", "покой"],
  nosugar:      ["sugar", "sweet", "сахар", "сладк"],
  sleep:        ["sleep", "bed", "night", "rest", "сон", "спать", "ночь"],
  productivity: ["pomodoro", "focus", "social", "media", "phone", "task", "work",
                 "помидор", "фокус", "соцсет", "телефон", "продуктив"],
  mental:       ["gratitude", "thankful", "mental", "mood", "stress", "anxiety",
                 "благодар", "ментальн", "настроен", "стресс"],
  default:      [],
};

export const CATEGORY_ICONS: Record<Category, string> = {
  workout:      "💪",
  water:        "💧",
  reading:      "📖",
  meditation:   "🧘",
  nosugar:      "🚫",
  sleep:        "😴",
  productivity: "⚡",
  mental:       "🌿",
  default:      "🎯",
};

export const CATEGORY_COLORS: Record<Category, { accent: string; bg: string; darkAccent: string; darkBg: string }> = {
  workout:      { accent: "#f97316", bg: "#fff7ed",  darkAccent: "#fb923c", darkBg: "rgba(251,146,60,0.12)" },
  water:        { accent: "#0ea5e9", bg: "#f0f9ff",  darkAccent: "#38bdf8", darkBg: "rgba(56,189,248,0.12)" },
  reading:      { accent: "#16a34a", bg: "#f0fdf4",  darkAccent: "#4ade80", darkBg: "rgba(74,222,128,0.12)" },
  meditation:   { accent: "#8b5cf6", bg: "#f5f3ff",  darkAccent: "#a78bfa", darkBg: "rgba(167,139,250,0.12)" },
  nosugar:      { accent: "#71717a", bg: "#f4f4f5",  darkAccent: "#a1a1aa", darkBg: "rgba(161,161,170,0.12)" },
  sleep:        { accent: "#6366f1", bg: "#eef2ff",  darkAccent: "#818cf8", darkBg: "rgba(129,140,248,0.12)" },
  productivity: { accent: "#f59e0b", bg: "#fffbeb",  darkAccent: "#fbbf24", darkBg: "rgba(251,191,36,0.12)" },
  mental:       { accent: "#10b981", bg: "#ecfdf5",  darkAccent: "#34d399", darkBg: "rgba(52,211,153,0.12)" },
  default:      { accent: "#5b4cf5", bg: "#ede9fe",  darkAccent: "#7c6dfa", darkBg: "rgba(124,109,250,0.15)" },
};

export function detectCategory(title: string): Category {
  const lower = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    if (cat === "default") continue;
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return "default";
}

export function useCategoryStyle(title: string, isDark: boolean, overrideIcon?: string) {
  const cat = detectCategory(title);
  const colors = CATEGORY_COLORS[cat];
  return {
    icon: overrideIcon ?? CATEGORY_ICONS[cat],
    accent: isDark ? colors.darkAccent : colors.accent,
    bg: isDark ? colors.darkBg : colors.bg,
    category: cat,
  };
}
