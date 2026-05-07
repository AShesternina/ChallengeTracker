/**
 * Syncs the current UI language to the Service Worker.
 * The SW stores it in IndexedDB and uses it to translate push notifications.
 * Call this whenever the language changes or the app starts.
 */
export async function setServiceWorkerLanguage(lang: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "SET_LANGUAGE", lang });
  } catch {
    // SW not available yet — silently ignore
  }
}
