import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
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
      const { data } = await authApi.loginEmail(email, password);
      setTokens(data.access_token, data.refresh_token);
      const me = await userApi.me();
      setUser(me.data);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("auth.login_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">{t("auth.app_name")}</h1>
          <p className="text-gray-500 mt-1">{t("auth.sign_in_subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder={t("auth.email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <PasswordInput
            placeholder={t("auth.password_placeholder")}
            value={password}
            onChange={setPassword}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t("auth.signing_in") : t("auth.sign_in")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t("auth.no_account")}{" "}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            {t("auth.register_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
