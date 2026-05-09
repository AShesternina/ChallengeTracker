import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInstallStore } from "../store/installStore";

export default function InstallBanner() {
  const { t } = useTranslation();
  const { isInstalled, isIOS, deferredPrompt, canShowBanner, dismiss, triggerInstall } =
    useInstallStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isInstalled && (deferredPrompt || isIOS) && canShowBanner()) {
      setVisible(true);
    }
  }, [isInstalled, isIOS, deferredPrompt]);

  if (!visible) return null;

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  const handleInstall = async () => {
    const accepted = await triggerInstall();
    if (accepted) setVisible(false);
  };

  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">📱</span>
          <div>
            <p className="text-[14px] font-bold text-text-primary">{t("install.title")}</p>
            <p className="text-[12px] text-text-tertiary mt-0.5">{t("install.body")}</p>
          </div>
        </div>
        <button onClick={handleDismiss} aria-label={t("install.dismiss")}
          className="text-text-tertiary hover:text-text-secondary p-1 shrink-0 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
      </div>

      {isIOS ? (
        <p className="text-[12px] text-text-secondary bg-surface2 rounded-lg px-3 py-2">
          {t("install.ios_hint")}
        </p>
      ) : (
        <button onClick={handleInstall}
          className="w-full py-2.5 rounded-md text-[13px] font-bold text-white transition-opacity"
          style={{ background: "var(--color-accent)" }}>
          {t("install.button")}
        </button>
      )}
    </div>
  );
}
