import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi, notificationsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { subscribeToPush } from "../services/push";

const TIMEZONES = [
  "UTC", "Europe/Moscow", "Europe/London", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Los_Angeles", "Asia/Tokyo", "Asia/Shanghai",
  "Australia/Sydney",
];

const LANGUAGES = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useAuthStore();
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

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

  const handleLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800">{t("settings.title")}</h2>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">{t("settings.profile")}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">{t("settings.email")}:</span> {user?.email || "—"}</p>
          <p><span className="font-medium">{t("settings.phone")}:</span> {user?.phone || "—"}</p>
        </div>
      </section>

      {/* Language */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">{t("settings.language")}</h3>
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguage(lang.code)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                i18n.language === lang.code
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Timezone */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">{t("settings.timezone")}</h3>
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
          {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
        </button>
      </section>

      {/* Push notifications */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">{t("settings.push_notifications")}</h3>
        {"PushManager" in window ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t("settings.web_push")}</p>
              <p className="text-xs text-gray-400">
                {pushEnabled ? t("settings.push_enabled") : t("settings.push_disabled")}
              </p>
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
          <p className="text-sm text-gray-400">{t("settings.push_not_supported")}</p>
        )}
      </section>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
      >
        {t("settings.sign_out")}
      </button>
    </div>
  );
}
