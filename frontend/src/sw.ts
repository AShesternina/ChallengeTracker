/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// ── Notification translations ────────────────────────────────────────────────

type Lang = "en" | "ru" | "es" | "pt";

interface NotificationStrings {
  title: string;
  body: string;
}

// Morning — default (no streak)
const MORNING_DEFAULT: Record<Lang, NotificationStrings> = {
  en: { title: "Good morning! ☀️",  body: "You have {total} tasks today. Let's go!" },
  ru: { title: "Доброе утро! ☀️",   body: "Сегодня {total} задач. Давай начнём!" },
  es: { title: "¡Buenos días! ☀️",  body: "Tienes {total} tareas hoy. ¡Vamos!" },
  pt: { title: "Bom dia! ☀️",       body: "Você tem {total} tarefas hoje. Vamos lá!" },
};

// Morning — with streak (streak > 1)
const MORNING_STREAK: Record<Lang, NotificationStrings> = {
  en: { title: "🔥 {streak} days in a row!",      body: "{total} tasks today. Don't stop now!" },
  ru: { title: "🔥 {streak} дней подряд!",         body: "{total} задач сегодня. Не останавливайся!" },
  es: { title: "🔥 ¡{streak} días seguidos!",      body: "{total} tareas hoy. ¡No pares ahora!" },
  pt: { title: "🔥 {streak} dias seguidos!",       body: "{total} tarefas hoje. Não pare agora!" },
};

// Daily report — 4 variants by completion rate
const DAILY_PERFECT: Record<Lang, NotificationStrings> = {
  en: { title: "🎉 Perfect day!",         body: "All {total} tasks done. You're unstoppable!" },
  ru: { title: "🎉 Идеальный день!",      body: "Все {total} задач выполнены. Так держать!" },
  es: { title: "🎉 ¡Día perfecto!",       body: "¡{total} tareas completadas. Eres imparable!" },
  pt: { title: "🎉 Dia perfeito!",        body: "Todas as {total} tarefas feitas. Você é incrível!" },
};

const DAILY_GREAT: Record<Lang, NotificationStrings> = {
  en: { title: "💪 Great result!",        body: "{completed}/{total} tasks — almost perfect. Keep it up!" },
  ru: { title: "💪 Отличный результат!",  body: "{completed}/{total} задач — почти идеально. Так держать!" },
  es: { title: "💪 ¡Gran resultado!",     body: "{completed}/{total} tareas — casi perfecto. ¡Sigue así!" },
  pt: { title: "💪 Ótimo resultado!",     body: "{completed}/{total} tarefas — quase perfeito. Continue!" },
};

const DAILY_GOOD: Record<Lang, NotificationStrings> = {
  en: { title: "👍 Good progress!",       body: "{completed}/{total} tasks done. Tomorrow we do more!" },
  ru: { title: "👍 Хороший прогресс!",    body: "{completed}/{total} задач выполнено. Завтра сделаем больше!" },
  es: { title: "👍 ¡Buen progreso!",      body: "{completed}/{total} tareas hechas. ¡Mañana más!" },
  pt: { title: "👍 Bom progresso!",       body: "{completed}/{total} tarefas feitas. Amanhã fazemos mais!" },
};

const DAILY_LOW: Record<Lang, NotificationStrings> = {
  en: { title: "💙 It's okay!",           body: "{completed}/{total} tasks today. Every step counts — tomorrow is a new chance." },
  ru: { title: "💙 Всё хорошо!",          body: "{completed}/{total} задач сегодня. Каждый шаг важен — завтра новый день." },
  es: { title: "💙 ¡Está bien!",          body: "{completed}/{total} tareas hoy. Cada paso cuenta — mañana es un nuevo comienzo." },
  pt: { title: "💙 Tudo bem!",            body: "{completed}/{total} tarefas hoje. Cada passo conta — amanhã é um novo começo." },
};

// Weekly review — high vs normal
const WEEKLY_HIGH: Record<Lang, NotificationStrings> = {
  en: { title: "🏆 Strong week!",         body: "✅ {completed}/{total} tasks · {rate}% {trend_arrow}" },
  ru: { title: "🏆 Сильная неделя!",      body: "✅ {completed}/{total} задач · {rate}% {trend_arrow}" },
  es: { title: "🏆 ¡Semana fuerte!",      body: "✅ {completed}/{total} tareas · {rate}% {trend_arrow}" },
  pt: { title: "🏆 Semana forte!",        body: "✅ {completed}/{total} tarefas · {rate}% {trend_arrow}" },
};

const WEEKLY_NORMAL: Record<Lang, NotificationStrings> = {
  en: { title: "📊 Weekly recap",         body: "{completed}/{total} tasks · {rate}% {trend_arrow} · Next week — better!" },
  ru: { title: "📊 Итоги недели",         body: "{completed}/{total} задач · {rate}% {trend_arrow} · Следующая неделя — лучше!" },
  es: { title: "📊 Resumen semanal",      body: "{completed}/{total} tareas · {rate}% {trend_arrow} · ¡La próxima semana mejor!" },
  pt: { title: "📊 Resumo semanal",       body: "{completed}/{total} tarefas · {rate}% {trend_arrow} · Próxima semana melhor!" },
};

const STATIC_TRANSLATIONS: Record<string, Record<Lang, NotificationStrings>> = {
  task_reminder: {
    en: { title: "⏰ Time for your task!",  body: "{tasks}" },
    ru: { title: "⏰ Пора браться за дело!", body: "{tasks}" },
    es: { title: "⏰ ¡Hora de tu tarea!",   body: "{tasks}" },
    pt: { title: "⏰ Hora da sua tarefa!",  body: "{tasks}" },
  },
  burnout_alert: {
    en: { title: "Tough week? That's okay 🌱", body: "You can pause a challenge to regroup — that's not giving up, it's being smart." },
    ru: { title: "Сложная неделя? Всё ок 🌱",  body: "Можешь поставить челлендж на паузу — это не сдаться, а перегруппироваться." },
    es: { title: "¿Semana difícil? Está bien 🌱", body: "Puedes pausar un desafío para reagruparte — eso no es rendirse, es ser inteligente." },
    pt: { title: "Semana difícil? Tudo bem 🌱",  body: "Você pode pausar um desafio para se reorganizar — isso não é desistir, é ser inteligente." },
  },
};

const FALLBACK_LANG: Lang = "en";
const SUPPORTED_LANGS = new Set<string>(["en", "ru", "es", "pt"]);

// ── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME = "ct_sw";
const DB_STORE = "settings";
const LANG_KEY = "language";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getLang(): Promise<Lang> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(LANG_KEY);
      req.onsuccess = () => {
        const val = req.result as string | undefined;
        resolve(SUPPORTED_LANGS.has(val ?? "") ? (val as Lang) : FALLBACK_LANG);
      };
      req.onerror = () => resolve(FALLBACK_LANG);
    });
  } catch {
    return FALLBACK_LANG;
  }
}

async function saveLang(lang: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(lang, LANG_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // best-effort
  }
}

// ── String interpolation ─────────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

// ── Dynamic notification resolution ─────────────────────────────────────────

function resolve(type: string, lang: Lang, data: Record<string, unknown>): { title: string; body: string } {
  const L = SUPPORTED_LANGS.has(lang) ? lang : FALLBACK_LANG;
  const vars = data as Record<string, string | number>;

  if (type === "morning_summary") {
    const streak = Number(data.streak ?? 0);
    const s = streak > 1
      ? (MORNING_STREAK[L] ?? MORNING_STREAK[FALLBACK_LANG])
      : (MORNING_DEFAULT[L] ?? MORNING_DEFAULT[FALLBACK_LANG]);
    return { title: interpolate(s.title, vars), body: interpolate(s.body, vars) };
  }

  if (type === "daily_report") {
    const rate = Number(data.rate ?? 0);
    const table = rate === 100 ? DAILY_PERFECT : rate >= 80 ? DAILY_GREAT : rate >= 50 ? DAILY_GOOD : DAILY_LOW;
    const s = table[L] ?? table[FALLBACK_LANG];
    return { title: s.title, body: interpolate(s.body, vars) };
  }

  if (type === "weekly_review") {
    const rate = Number(data.rate ?? 0);
    const s = rate >= 80
      ? (WEEKLY_HIGH[L] ?? WEEKLY_HIGH[FALLBACK_LANG])
      : (WEEKLY_NORMAL[L] ?? WEEKLY_NORMAL[FALLBACK_LANG]);
    return { title: s.title, body: interpolate(s.body, vars) };
  }

  const s = STATIC_TRANSLATIONS[type]?.[L] ?? STATIC_TRANSLATIONS[type]?.[FALLBACK_LANG];
  if (!s) return { title: type, body: "" };
  return { title: s.title, body: interpolate(s.body, vars) };
}

// ── Push event ───────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: Record<string, unknown> = {};
  try {
    data = event.data.json() as Record<string, unknown>;
  } catch {
    return;
  }

  const type = data.type as string | undefined;
  if (!type) return;

  event.waitUntil(
    getLang().then((lang) => {
      const { title, body } = resolve(type, lang, data);
      return self.registration.showNotification(title, {
        body,
        data: { url: (data.url as string) || "/" },
        requireInteraction: true,
      });
    })
  );
});

// ── Message event (language sync from frontend) ──────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_LANGUAGE") {
    const lang = event.data.lang as string;
    if (SUPPORTED_LANGS.has(lang)) {
      saveLang(lang).catch(() => {});
    }
  }
});

// ── Notification click ───────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = (event.notification.data as { url: string }).url;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === url && "focus" in c);
        if (existing) return (existing as WindowClient).focus();
        return self.clients.openWindow(url);
      })
  );
});
