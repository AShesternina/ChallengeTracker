import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  dark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set((s) => {
        const next = !s.dark;
        document.documentElement.classList.toggle("dark", next);
        return { dark: next };
      }),
      setDark: (v) => {
        document.documentElement.classList.toggle("dark", v);
        set({ dark: v });
      },
    }),
    { name: "ct-theme" }
  )
);

export function initTheme() {
  const stored = localStorage.getItem("ct-theme");
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.dark) document.documentElement.classList.add("dark");
    } catch {}
  }
}
