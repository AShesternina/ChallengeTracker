import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";
import i18n from "../i18n";
import { setServiceWorkerLanguage } from "../services/sw-lang";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data } = await authApi.registerEmail(email, password, tz);
      setTokens(data.access_token, data.refresh_token);
      const me = await userApi.me();
      setUser(me.data);
      await i18n.changeLanguage(me.data.language || "en");
      setServiceWorkerLanguage(me.data.language || "en");
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("auth.register_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
            style={{ background: "linear-gradient(135deg, var(--color-accent), #2563eb)" }}>
            <span className="text-white text-2xl">⚡</span>
          </div>
          <h1 className="text-[26px] font-black text-text-primary" style={{ letterSpacing: "-0.5px" }}>
            ChallengeTracker
          </h1>
          <p className="text-[14px] text-text-secondary mt-1">{t("auth.register_subtitle")}</p>
        </div>

        <div className="rounded-xl p-6 shadow-md"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md text-[13px]"
              style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder={t("auth.email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-md text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors"
              style={{ background: "var(--color-surface2)", border: "1.5px solid var(--color-border)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
            <PasswordInput
              placeholder={t("auth.password_hint")}
              value={password}
              onChange={setPassword}
              minLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-[14px] font-bold text-white rounded-md disabled:opacity-50 transition-opacity mt-1"
              style={{ background: "var(--color-accent)" }}
            >
              {loading ? t("auth.creating") : t("auth.create_account")}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-text-secondary mt-5">
          {t("auth.have_account")}{" "}
          <Link to="/login" className="font-semibold" style={{ color: "var(--color-accent)" }}>
            {t("auth.sign_in_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
