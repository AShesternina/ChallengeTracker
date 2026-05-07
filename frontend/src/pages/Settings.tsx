import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { subscribeToPush } from "../services/push";
import { SunIcon, MoonIcon } from "../components/Icons";

const TIMEZONES = [
  "UTC", "Europe/Moscow", "Europe/London", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Los_Angeles", "Asia/Tokyo", "Asia/Shanghai",
  "Australia/Sydney",
];

// Sorted alphabetically by label
const LANGUAGES = [
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "es", label: "Español",   flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ru", label: "Русский",   flag: "🇷🇺" },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
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

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    try {
      const { data } = await userApi.update({ language: code });
      setUser(data);
    } catch {
      // language already applied locally, silent fail
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

  const userName = user?.email?.split("@")[0] ?? "—";
  const initial = userName[0]?.toUpperCase() ?? "U";

  return (
    <div className="space-y-5">
      <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
        {t("settings.title")}
      </h2>

      {/* Profile */}
      <Section title={t("settings.profile")}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[18px] font-black shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-accent), #2563eb)" }}>
            {initial}
          </div>
          <div>
            <p className="font-bold text-text-primary text-[15px]">{userName}</p>
            <p className="text-[12px] text-text-tertiary">{user?.email || "—"}</p>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title={t("settings.appearance")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {dark ? <MoonIcon size={16} className="text-text-secondary" /> : <SunIcon size={16} className="text-text-secondary" />}
            <span className="text-[14px] font-semibold text-text-primary">
              {dark ? t("settings.dark_mode") : t("settings.light_mode")}
            </span>
          </div>
          <Toggle enabled={dark} onToggle={toggle} loading={false} />
        </div>
      </Section>

      {/* Language */}
      <Section title={t("settings.language")}>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button key={lang.code} onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-md text-[13px] font-bold transition-all"
              style={{
                border: `1.5px solid ${i18n.language.startsWith(lang.code) ? "var(--color-accent)" : "var(--color-border)"}`,
                background: i18n.language.startsWith(lang.code) ? "var(--color-accent-soft)" : "var(--color-surface2)",
                color: i18n.language.startsWith(lang.code) ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}>
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Timezone */}
      <Section title={t("settings.timezone")}>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3 py-2.5 rounded-md text-[13px] text-text-primary outline-none mb-3"
          style={{ background: "var(--color-surface2)", border: "1.5px solid var(--color-border)" }}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 rounded-md text-[13px] font-bold text-white disabled:opacity-50 transition-opacity"
          style={{ background: saved ? "var(--color-success)" : "var(--color-accent)" }}>
          {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
        </button>
      </Section>

      {/* Push notifications */}
      <Section title={t("settings.push_notifications")}>
        {"PushManager" in window ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-text-primary">{t("settings.web_push")}</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">
                {pushEnabled ? t("settings.push_enabled") : t("settings.push_disabled")}
              </p>
            </div>
            <Toggle enabled={pushEnabled} onToggle={handlePushToggle} loading={pushLoading} />
          </div>
        ) : (
          <p className="text-[13px] text-text-tertiary">{t("settings.push_not_supported")}</p>
        )}
      </Section>

      {/* Logout */}
      <button onClick={logout}
        className="w-full py-3 rounded-md text-[14px] font-bold transition-colors"
        style={{ border: "1.5px solid var(--color-danger)", color: "var(--color-danger)" }}>
        {t("settings.sign_out")}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md p-4 space-y-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function Toggle({ enabled, onToggle, loading }: { enabled: boolean; onToggle: () => void; loading: boolean }) {
  return (
    <button onClick={onToggle} disabled={loading}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ background: enabled ? "var(--color-accent)" : "var(--color-border-strong)" }}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
