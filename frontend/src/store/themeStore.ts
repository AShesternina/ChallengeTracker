import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeValue = "system" | "light" | "dark";

interface ThemeState {
  theme: ThemeValue;
  dark: boolean; // resolved: true if dark is actually applied
  setTheme: (v: ThemeValue) => void;
  setDark: (v: boolean) => void; // legacy compat — called from App.tsx
}

function resolvesDark(theme: ThemeValue): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system" as ThemeValue,
      dark: resolvesDark("system"),

      setTheme: (theme) => {
        const dark = resolvesDark(theme);
        applyDark(dark);
        set({ theme, dark });
      },

      setDark: (dark) => {
        // Called from App.tsx on startup with server value
        // Convert boolean back to stored theme if theme is not system
        const current = get().theme;
        if (current !== "system") {
          applyDark(dark);
          set({ dark, theme: dark ? "dark" : "light" });
        } else {
          // If theme is system, re-resolve from OS
          const resolved = resolvesDark("system");
          applyDark(resolved);
          set({ dark: resolved });
        }
      },
    }),
    { name: "ct-theme", partialize: (s) => ({ theme: s.theme }) }
  )
);

// Listen to OS preference changes when theme = "system"
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const { theme } = useThemeStore.getState();
    if (theme === "system") {
      applyDark(e.matches);
      useThemeStore.setState({ dark: e.matches });
    }
  });
}

export function initTheme() {
  const stored = localStorage.getItem("ct-theme");
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      const theme: ThemeValue = state?.theme ?? "system";
      applyDark(resolvesDark(theme));
    } catch {}
  } else {
    applyDark(resolvesDark("system"));
  }
}
