/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// ── Notification translations ────────────────────────────────────────────────
// Adding a new language: add its code to each entry below. No other changes needed.

type Lang = "en" | "ru" | "es" | "pt";

interface NotificationStrings {
  title: string;
  body: string; // supports {placeholders}
}

const TRANSLATIONS: Record<string, Record<Lang, NotificationStrings>> = {
  morning_summary: {
    en: { title: "Good morning! ☀️",    body: "You have {total} tasks today. Let's go!" },
    ru: { title: "Доброе утро! ☀️",      body: "Сегодня у вас {total} задач. Вперёд!" },
    es: { title: "¡Buenos días! ☀️",     body: "Tienes {total} tareas hoy. ¡Vamos!" },
    pt: { title: "Bom dia! ☀️",          body: "Você tem {total} tarefas hoje. Vamos lá!" },
  },
  daily_report: {
    en: { title: "Daily Report 📊",      body: "You completed {completed}/{total} tasks today ({rate}%)." },
    ru: { title: "Итоги дня 📊",         body: "Сегодня выполнено {completed}/{total} задач ({rate}%)." },
    es: { title: "Informe diario 📊",    body: "Completaste {completed}/{total} tareas hoy ({rate}%)." },
    pt: { title: "Relatório diário 📊",  body: "Você concluiu {completed}/{total} tarefas hoje ({rate}%)." },
  },
  task_reminder: {
    en: { title: "Time for your tasks! ⏰", body: "{tasks}" },
    ru: { title: "Время задач! ⏰",         body: "{tasks}" },
    es: { title: "¡Hora de las tareas! ⏰", body: "{tasks}" },
    pt: { title: "Hora das tarefas! ⏰",    body: "{tasks}" },
  },
  weekly_review: {
    en: { title: "Weekly recap 🔥",         body: "✅ {completed}/{total} tasks · {rate}% {trend_arrow}" },
    ru: { title: "Итоги недели 🔥",         body: "✅ {completed}/{total} задач · {rate}% {trend_arrow}" },
    es: { title: "Resumen semanal 🔥",      body: "✅ {completed}/{total} tareas · {rate}% {trend_arrow}" },
    pt: { title: "Resumo semanal 🔥",       body: "✅ {completed}/{total} tarefas · {rate}% {trend_arrow}" },
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
  if (!type || !(type in TRANSLATIONS)) return;

  event.waitUntil(
    getLang().then((lang) => {
      const strings = TRANSLATIONS[type][lang] ?? TRANSLATIONS[type][FALLBACK_LANG];
      const title = strings.title;
      const body = interpolate(strings.body, data as Record<string, string | number>);

      return self.registration.showNotification(title, {
        body,
        data: { url: (data.url as string) || "/" },
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
