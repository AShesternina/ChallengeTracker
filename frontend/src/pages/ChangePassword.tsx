import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { userApi } from "../services/api";
import PasswordInput from "../components/PasswordInput";

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (next !== confirm) { setError(t("settings.password_mismatch")); return; }
    setSaving(true); setError("");
    try {
      await userApi.changePassword(current, next);
      setSaved(true);
      setTimeout(() => navigate("/settings"), 1500);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg === "Current password is incorrect" ? t("settings.password_wrong") : (msg || t("settings.password_wrong")));
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate("/settings")}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "var(--color-surface2)" }}
          aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-text-primary">{t("settings.change_password")}</h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 pt-2 space-y-3 max-w-md w-full mx-auto">
        <PasswordInput
          value={current}
          onChange={v => { setCurrent(v); setError(""); setSaved(false); }}
          placeholder={t("settings.current_password")}
        />
        <PasswordInput
          value={next}
          onChange={v => { setNext(v); setError(""); setSaved(false); }}
          placeholder={t("settings.new_password")}
        />
        <PasswordInput
          value={confirm}
          onChange={v => { setConfirm(v); setError(""); setSaved(false); }}
          placeholder={t("settings.confirm_password")}
        />

        {error && (
          <p className="text-[13px]" style={{ color: "var(--color-danger)" }}>{error}</p>
        )}

        <button
          disabled={saving || !current || !next || !confirm}
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl text-[15px] font-bold text-white disabled:opacity-40 transition-opacity mt-2"
          style={{ background: saved ? "var(--color-success)" : "var(--color-accent)" }}>
          {saving ? t("common.saving") : saved ? t("settings.password_changed") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
