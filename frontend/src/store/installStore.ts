import { create } from "zustand";

const DISMISS_COUNT_KEY = "ct-install-dismiss-count";
const DISMISS_AT_KEY = "ct-install-dismissed-at";
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function getIsInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function getIsIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

interface InstallState {
  deferredPrompt: any;
  isInstalled: boolean;
  isIOS: boolean;
  setDeferredPrompt: (e: any) => void;
  setInstalled: (v: boolean) => void;
  canShowBanner: () => boolean;
  dismiss: () => void;
  triggerInstall: () => Promise<boolean>;
}

export const useInstallStore = create<InstallState>((set, get) => ({
  deferredPrompt: null,
  isInstalled: getIsInstalled(),
  isIOS: getIsIOS(),

  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  setInstalled: (v) => set({ isInstalled: v }),

  canShowBanner: () => {
    const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || "0");
    if (count >= 2) return false;
    if (count === 0) return true;
    const dismissedAt = parseInt(localStorage.getItem(DISMISS_AT_KEY) || "0");
    return Date.now() - dismissedAt > TWO_DAYS_MS;
  },

  dismiss: () => {
    const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || "0");
    localStorage.setItem(DISMISS_COUNT_KEY, String(count + 1));
    localStorage.setItem(DISMISS_AT_KEY, String(Date.now()));
  },

  triggerInstall: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    set({ deferredPrompt: null });
    return outcome === "accepted";
  },
}));
