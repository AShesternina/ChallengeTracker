import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import {
  HomeIcon, HomeFilledIcon,
  ListIcon, ListFilledIcon,
  TargetIcon, TargetFilledIcon,
  BarChartIcon, BarChartFilledIcon,
  GearIcon, GearFilledIcon,
  MoonIcon, SunIcon,
} from "./Icons";

const NAV = [
  { to: "/", labelKey: "nav.dashboard", Icon: HomeIcon, FilledIcon: HomeFilledIcon },
  { to: "/daily", labelKey: "nav.today", Icon: ListIcon, FilledIcon: ListFilledIcon },
  { to: "/challenges", labelKey: "nav.challenges", Icon: TargetIcon, FilledIcon: TargetFilledIcon },
  { to: "/reports", labelKey: "nav.reports", Icon: BarChartIcon, FilledIcon: BarChartFilledIcon },
  { to: "/settings", labelKey: "nav.settings", Icon: GearIcon, FilledIcon: GearFilledIcon },
];

export default function Layout() {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const THEME_CYCLE: Record<string, "light" | "dark" | "system"> = { system: "light", light: "dark", dark: "system" };
  const handleThemeToggle = async () => { setTheme(THEME_CYCLE[theme] ?? "system"); };
  const { user } = useAuthStore();
  const location = useLocation();

  const firstName = user?.email?.split("@")[0] ?? "You";
  const initial = firstName[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen flex bg-bg">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 h-screen fixed top-0 left-0 border-r border-border bg-surface z-40">
        <div className="px-5 pt-6 pb-4">
          <span className="text-[15px] font-black tracking-tight" style={{ color: "var(--color-accent)", letterSpacing: "-0.3px" }}>
            ChallengeTracker
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ to, labelKey, Icon, FilledIcon }) => {
            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <NavLink key={to} to={to} end={to === "/"} className="block">
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-theme ${
                  isActive ? "bg-accent-soft text-accent font-semibold" : "text-text-secondary hover:bg-surface2"
                }`}>
                  {isActive ? <FilledIcon size={18} /> : <Icon size={18} strokeWidth={1.9} />}
                  <span className="text-[14px]">{t(labelKey as any)}</span>
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 pb-6 border-t border-border pt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-accent), #2563eb)" }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate">{firstName}</p>
            <p className="text-[11px] text-text-tertiary truncate">{user?.email}</p>
          </div>
          <button onClick={handleThemeToggle} aria-label={t("common.toggle_theme")} className="text-text-tertiary hover:text-text-secondary transition-colors p-1">
            {theme === "dark" ? <SunIcon size={16} /> : theme === "light" ? <MoonIcon size={16} /> : <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 2a7 7 0 1 0 0 14A7 7 0 0 0 9 2z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 2a7 7 0 0 1 0 14V2z" fill="currentColor"/></svg>}
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-5 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-1 pt-1 pb-safe"
        style={{
          height: "60px",
          background: "var(--color-nav-bg)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--color-border)",
        }}>
        {NAV.map(({ to, labelKey, Icon, FilledIcon }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} end={to === "/"} className="flex flex-col items-center gap-0.5 flex-1 py-0.5">
              <span className={`flex items-center justify-center rounded-[10px] transition-theme ${
                isActive ? "bg-accent-soft" : ""
              }`} style={{ width: 36, height: 28 }}>
                {isActive
                  ? <FilledIcon size={18} className="text-accent" />
                  : <Icon size={18} strokeWidth={1.9} className="text-text-tertiary" />
                }
              </span>
              <span className={`text-[9px] leading-none transition-colors ${
                isActive ? "text-accent font-bold" : "text-text-tertiary font-medium"
              }`}>{t(labelKey as any)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
