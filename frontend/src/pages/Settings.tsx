import { useEffect, useState } from "react";
import { userApi, notificationsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { subscribeToPush } from "../services/push";

const TIMEZONES = [
  "UTC", "Europe/Moscow", "Europe/London", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Los_Angeles", "Asia/Tokyo", "Asia/Shanghai",
  "Australia/Sydney",
];

export default function Settings() {
  const { user, setUser, logout } = useAuthStore();
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setPushEnabled(!!sub);
      });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userApi.update({ timezone });
      setUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        setPushEnabled(false);
      } else {
        await subscribeToPush();
        setPushEnabled(true);
      }
    } catch (e) {
      console.error("Push toggle failed:", e);
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">Profile</h3>
        <div className="text-sm text-gray-600">
          <p><span className="font-medium">Email:</span> {user?.email || "—"}</p>
          <p><span className="font-medium">Phone:</span> {user?.phone || "—"}</p>
        </div>
      </section>

      {/* Timezone */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">Timezone</h3>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save"}
        </button>
      </section>

      {/* Push notifications */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">Push Notifications</h3>
        {"PushManager" in window ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Web push</p>
              <p className="text-xs text-gray-400">{pushEnabled ? "Enabled" : "Disabled"}</p>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={pushLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                pushEnabled ? "bg-primary-600" : "bg-gray-300"
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Push notifications not supported in this browser.</p>
        )}
      </section>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
