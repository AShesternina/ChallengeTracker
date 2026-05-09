/**
 * Cloudflare Worker — Telegram API proxy
 *
 * Forwards requests to api.telegram.org.
 * Protected by X-Proxy-Secret header to prevent public abuse.
 *
 * Environment variables (set in Cloudflare dashboard):
 *   PROXY_SECRET — random secret string, must match TELEGRAM_PROXY_SECRET in backend .env
 */

export default {
  async fetch(request, env) {
    // Reject requests without the correct secret
    if (request.headers.get("X-Proxy-Secret") !== env.PROXY_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }

    // Rewrite URL: worker.yourname.workers.dev/... → api.telegram.org/...
    const url = new URL(request.url);
    url.hostname = "api.telegram.org";
    url.port = "";
    url.protocol = "https:";

    // Forward without the proxy secret header
    const headers = new Headers(request.headers);
    headers.delete("X-Proxy-Secret");

    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers,
      body: request.body,
    });

    return fetch(proxyRequest);
  },
};
