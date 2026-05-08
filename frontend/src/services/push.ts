import { notificationsApi } from "./api";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output.buffer as ArrayBuffer;
}

// Returns the backend device ID so the caller can delete it on unsubscribe
export async function subscribeToPush(): Promise<number> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push not supported");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permission denied");

  const { data } = await notificationsApi.vapidKey();
  const vapidKey = data.vapid_public_key;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const sub = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const { data: device } = await notificationsApi.subscribe(
    { endpoint: sub.endpoint, keys: sub.keys },
    navigator.userAgent
  );

  return device.id as number;
}
