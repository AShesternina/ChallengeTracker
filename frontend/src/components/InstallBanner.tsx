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
    <div className="rounded-xl px-3 py-3 flex items-center gap-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

      {/* App icon */}
      <img src="/icons/icon.svg" alt="" aria-hidden="true"
        className="w-11 h-11 rounded-xl shrink-0"
        style={{ boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }} />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-text-primary leading-tight">{t("install.title")}</p>
        <p className="text-[11px] text-text-tertiary mt-0.5 leading-tight">{t("install.body")}</p>
        {isIOS && (
          <p className="text-[11px] text-text-secondary mt-1">{t("install.ios_hint")}</p>
        )}
      </div>

      {/* Actions */}
      {!isIOS && (
        <button onClick={handleInstall}
          className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white"
          style={{ background: "var(--color-accent)" }}>
          {t("install.button")}
        </button>
      )}
      <button onClick={handleDismiss} aria-label={t("install.dismiss")}
        className="shrink-0 text-text-tertiary hover:text-text-secondary transition-colors p-0.5">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="1" y1="1" x2="13" y2="13" />
          <line x1="13" y1="1" x2="1" y2="13" />
        </svg>
      </button>
    </div>
  );
}
