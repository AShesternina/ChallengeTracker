import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { userApi, notificationsApi, telegramApi, authApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useInstallStore } from "../store/installStore";
import { subscribeToPush } from "../services/push";
import { setServiceWorkerLanguage } from "../services/sw-lang";
import { SunIcon, MoonIcon } from "../components/Icons";
import ConfirmModal from "../components/ConfirmModal";

const TIMEZONES = [
  "UTC", "Europe/Moscow", "Europe/London", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Los_Angeles", "Asia/Tokyo", "Asia/Shanghai",
  "Australia/Sydney",
];

const LANGUAGES = [
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "es", label: "Español",   flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ru", label: "Русский",   flag: "🇷🇺" },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const { dark, setDark } = useThemeStore();
  const { isInstalled, isIOS, deferredPrompt, triggerInstall } = useInstallStore();
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [morningTime, setMorningTime] = useState(user?.notification_morning_time || "08:00");
  const [eveningTime, setEveningTime] = useState(user?.notification_evening_time || "21:00");
  const [taskReminders, setTaskReminders] = useState(user?.notify_task_reminders ?? false);
  const [streakProtection, setStreakProtection] = useState(user?.streak_protection ?? true);
  const [savingTimes, setSavingTimes] = useState(false);
  const [savedTimes, setSavedTimes] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [telegramPolling, setTelegramPolling] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Always load fresh user data so settings are in sync across devices
    userApi.me().then(({ data }) => {
      setUser(data);
      setTimezone(data.timezone || "UTC");
      setMorningTime(data.notification_morning_time || "08:00");
      setEveningTime(data.notification_evening_time || "21:00");
      setTaskReminders(data.notify_task_reminders ?? false);
      setStreakProtection(data.streak_protection ?? true);
    }).catch(() => {});

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      setPushEnabled(true);
      try {
        const { data: devices } = await notificationsApi.devices();
        const match = devices.find(
          (d: any) => JSON.parse(d.push_subscription).endpoint === sub.endpoint
        );
        if (match) setDeviceId(match.id);
      } catch {}
    });
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
    setServiceWorkerLanguage(code);
    try {
      const { data } = await userApi.update({ language: code });
      setUser(data);
    } catch {}
  };

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        if (deviceId !== null) {
          await notificationsApi.unsubscribe(deviceId);
          setDeviceId(null);
        }
        setPushEnabled(false);
      } else {
        const id = await subscribeToPush();
        setDeviceId(id);
        setPushEnabled(true);
      }
    } catch (e) {
      console.error("Push toggle failed:", e);
    } finally {
      setPushLoading(false);
    }
  };

  const handleSaveNotifTimes = async () => {
    setSavingTimes(true);
    try {
      const { data } = await userApi.update({
        notification_morning_time: morningTime,
        notification_evening_time: eveningTime,
      });
      setUser(data);
      setSavedTimes(true);
      setTimeout(() => setSavedTimes(false), 2000);
    } finally {
      setSavingTimes(false);
    }
  };

  const handleTelegramDisconnect = async () => {
    await telegramApi.unlink();
    const { data } = await userApi.me();
    setUser(data);
  };

  const handleTelegramConnect = async () => {
    setTelegramLinking(true);
    try {
      const { data } = await telegramApi.generateCode();
      window.open(data.bot_url, "_blank");
      setTelegramPolling(true);
      const interval = setInterval(async () => {
        const me = await userApi.me();
        if (me.data.telegram_chat_id) {
          setUser(me.data);
          setTelegramPolling(false);
          clearInterval(interval);
        }
      }, 3000);
      setTimeout(() => {
        clearInterval(interval);
        setTelegramPolling(false);
      }, 120000);
    } finally {
      setTelegramLinking(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await userApi.deleteMe();
      logout();
      navigate("/login");
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const userName = user?.email?.split("@")[0] ?? "—";
  const initial = userName[0]?.toUpperCase() ?? "U";

  const handleThemeToggle = async () => {
    const next = !dark;
    setDark(next);
    try { await userApi.update({ theme: next ? "dark" : "light" }); } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-black text-text-primary" style={{ letterSpacing: "-0.4px" }}>
          {t("settings.title")}
        </h2>
        <button
          onClick={handleThemeToggle}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "var(--color-surface2)" }}
          aria-label={t("common.toggle_theme")}>
          {dark ? <MoonIcon size={18} className="text-text-secondary" /> : <SunIcon size={18} className="text-text-secondary" />}
        </button>
      </div>

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

      {/* Install app */}
      {!isInstalled && (deferredPrompt || isIOS) && (
        <Section title={t("install.settings_title")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0" aria-hidden="true">📱</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text-primary">{t("install.settings_body")}</p>
                {isIOS && (
                  <p className="text-[11px] text-text-tertiary mt-0.5">{t("install.ios_hint")}</p>
                )}
              </div>
            </div>
            {!isIOS && (
              <button onClick={triggerInstall}
                className="shrink-0 px-3 py-1.5 rounded-md text-[12px] font-bold text-white"
                style={{ background: "var(--color-accent)" }}>
                {t("install.button")}
              </button>
            )}
          </div>
        </Section>
      )}

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
          className="w-full px-3 py-2.5 rounded-md text-[13px] text-text-primary outline-none mb-3 appearance-none"
          style={{
            background: "var(--color-surface2)",
            border: "1.5px solid var(--color-border)",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "36px",
          }}>
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
              <p className="text-[12px] text-text-tertiary mt-0.5">{t("settings.push_device_hint")}</p>
            </div>
            <Toggle enabled={pushEnabled} onToggle={handlePushToggle} loading={pushLoading} label={t("settings.web_push")} />
          </div>
        ) : (
          <p className="text-[13px] text-text-tertiary">{t("settings.push_not_supported")}</p>
        )}
      </Section>

      {/* Telegram */}
      <Section title="Telegram">
        {user?.telegram_chat_id ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-text-primary">{t("settings.telegram_connected")}</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">Chat ID: {user.telegram_chat_id}</p>
            </div>
            <button onClick={handleTelegramDisconnect}
              className="text-[13px] font-semibold px-3 py-1.5 rounded-md transition-colors"
              style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
              {t("settings.telegram_disconnect")}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[13px] text-text-tertiary mb-3">{t("settings.telegram_hint")}</p>
            {telegramPolling ? (
              <p className="text-[13px] text-text-tertiary text-center py-2">{t("settings.telegram_waiting")}</p>
            ) : (
              <button onClick={handleTelegramConnect} disabled={telegramLinking}
                className="w-full py-2.5 rounded-md text-[13px] font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ background: "#2AABEE" }}>
                {t("settings.telegram_connect")}
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Notification times */}
      <Section title={t("settings.notif_times")}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[13px] font-semibold text-text-primary truncate flex-1">
              {t("settings.morning_notification")}
            </label>
            <input type="time" value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="px-2 py-1.5 rounded-md text-[13px] text-text-primary outline-none shrink-0"
              style={{ background: "var(--color-surface2)", border: "1.5px solid var(--color-border)", width: "110px" }} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-[13px] font-semibold text-text-primary truncate flex-1">
              {t("settings.evening_notification")}
            </label>
            <input type="time" value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="px-2 py-1.5 rounded-md text-[13px] text-text-primary outline-none shrink-0"
              style={{ background: "var(--color-surface2)", border: "1.5px solid var(--color-border)", width: "110px" }} />
          </div>
          <button onClick={handleSaveNotifTimes} disabled={savingTimes}
            className="w-full py-2 rounded-md text-[13px] font-bold text-white disabled:opacity-50 transition-opacity"
            style={{ background: savedTimes ? "var(--color-success)" : "var(--color-accent)" }}>
            {savingTimes ? t("common.saving") : savedTimes ? t("common.saved") : t("common.save")}
          </button>
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary">{t("settings.task_reminders")}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">{t("settings.task_reminders_hint")}</p>
            </div>
            <div className="shrink-0 mt-0.5">
              <Toggle enabled={taskReminders} loading={false} label={t("settings.task_reminders")} onToggle={async () => {
                const next = !taskReminders;
                setTaskReminders(next);
                const { data } = await userApi.update({ notify_task_reminders: next });
                setUser(data);
              }} />
            </div>
          </div>
        </div>
      </Section>

      {/* Streak protection */}
      <Section title={t("detail.streak")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-text-primary">{t("settings.streak_protection")}</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">{t("settings.streak_protection_hint")}</p>
          </div>
          <div className="shrink-0 mt-0.5">
            <Toggle enabled={streakProtection} loading={false} label={t("settings.streak_protection")} onToggle={async () => {
              const next = !streakProtection;
              setStreakProtection(next);
              const { data } = await userApi.update({ streak_protection: next });
              setUser(data);
            }} />
          </div>
        </div>
      </Section>

      {/* Account */}
      <Section title={t("settings.account")}>
        <div className="space-y-1">
          {user?.email && (
            <div className="px-1 pb-2">
              <p className="text-[13px] text-text-tertiary">{user.email}</p>
              {!user.is_verified && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px]" style={{ color: "var(--color-warning, #f59e0b)" }}>
                    ⚠️ {t("auth.not_verified_hint")}
                  </p>
                  <button
                    disabled={resending || resendDone}
                    onClick={async () => {
                      setResending(true);
                      try { await authApi.resendVerification(); setResendDone(true); } catch {}
                      finally { setResending(false); }
                    }}
                    className="text-[11px] font-semibold disabled:opacity-50"
                    style={{ color: "var(--color-accent)" }}>
                    {resendDone ? t("auth.resend_done") : t("auth.resend_verification")}
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={() => navigate("/settings/change-password")}
            className="w-full flex items-center justify-between py-2 px-1 rounded-md transition-colors"
            style={{ color: "var(--color-text-primary)" }}>
            <span className="text-[14px] font-semibold">{t("settings.change_password")}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-tertiary">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ borderTop: "1px solid var(--color-border)" }} className="pt-2 mt-1 space-y-1">
            <button onClick={logout}
              className="w-full text-left py-2 px-1 text-[14px] font-bold rounded-md transition-colors"
              style={{ color: "var(--color-danger)" }}>
              {t("settings.sign_out")}
            </button>
            <button onClick={() => setShowDeleteModal(true)}
              className="w-full text-left py-2 px-1 text-[13px] font-semibold rounded-md transition-colors text-text-tertiary">
              {t("settings.delete_account")}
            </button>
          </div>
        </div>
      </Section>

      {showDeleteModal && (
        <ConfirmModal
          emoji="⚠️"
          title={t("settings.confirm_delete_account")}
          body={t("settings.confirm_delete_account_body")}
          confirmLabel={deleting ? "..." : t("settings.confirm_delete_account_yes")}
          cancelLabel={t("settings.confirm_delete_account_no")}
          confirmDanger={true}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
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

function Toggle({ enabled, onToggle, loading, label }: { enabled: boolean; onToggle: () => void; loading: boolean; label: string }) {
  return (
    <button onClick={onToggle} disabled={loading} aria-label={label} aria-pressed={enabled}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ background: enabled ? "var(--color-accent)" : "var(--color-border-strong)" }}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
