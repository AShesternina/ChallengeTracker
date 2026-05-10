/**
 * Cloudflare Worker — двусторонний Telegram прокси
 *
 * 1. GET|POST /webhook — входящие обновления от Telegram → пересылает на VPS
 * 2. Всё остальное — исходящие запросы VPS → api.telegram.org (защищено X-Proxy-Secret)
 *
 * Env vars (Cloudflare dashboard → Workers → tg-proxy → Settings → Variables):
 *   PROXY_SECRET — секрет для защиты исходящих запросов
 *   BACKEND_URL  — URL бэкенда, например https://api.tracker.shura.pro
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Входящий webhook от Telegram → пересылаем на VPS
    if (url.pathname === "/webhook") {
      const target = `${env.BACKEND_URL}/api/v1/telegram/webhook`;
      return fetch(target, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }

    // Исходящие запросы VPS → Telegram: проверяем секрет
    if (request.headers.get("X-Proxy-Secret") !== env.PROXY_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }

    // Перенаправляем на api.telegram.org
    url.hostname = "api.telegram.org";
    url.port = "";
    url.protocol = "https:";

    const headers = new Headers(request.headers);
    headers.delete("X-Proxy-Secret");

    return fetch(url.toString(), {
      method: request.method,
      headers,
      body: request.body,
    });
  },
};
