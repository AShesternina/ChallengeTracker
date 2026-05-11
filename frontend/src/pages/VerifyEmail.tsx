import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../services/api";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm text-center space-y-4">
        {status === "loading" && (
          <p className="text-text-secondary text-[15px]">...</p>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl">🎉</div>
            <h1 className="text-[22px] font-bold text-text-primary">{t("auth.verify_success")}</h1>
            <p className="text-[14px] text-text-secondary">{t("auth.verify_success_body")}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl text-[15px] font-bold text-white mt-2"
              style={{ background: "var(--color-accent)" }}>
              {t("auth.go_to_app")}
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl">😕</div>
            <h1 className="text-[22px] font-bold text-text-primary">{t("auth.verify_error")}</h1>
            <p className="text-[14px] text-text-secondary">{t("auth.verify_error_body")}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl text-[15px] font-bold text-white mt-2"
              style={{ background: "var(--color-accent)" }}>
              {t("auth.go_to_app")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
