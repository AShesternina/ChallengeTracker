import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useInstallStore } from "./store/installStore";
import { useThemeStore } from "./store/themeStore";
import { setServiceWorkerLanguage } from "./services/sw-lang";
import { userApi } from "./services/api";
import i18n from "./i18n";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OnboardingPage from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import DailyTasks from "./pages/DailyTasks";
import Challenges from "./pages/Challenges";
import CreateChallenge from "./pages/CreateChallenge";
import Reports from "./pages/Reports";
import ChallengeReport from "./pages/ChallengeReport";
import ChallengeDetail from "./pages/ChallengeDetail";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import VerifyEmail from "./pages/VerifyEmail";
import PublicChallenge from "./pages/PublicChallenge";
import ChallengeTemplates from "./pages/ChallengeTemplates";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { setDeferredPrompt, setInstalled } = useInstallStore();

  // On startup: fetch fresh user data from server to sync all account settings
  useEffect(() => {
    if (!user) return;
    userApi.me().then(({ data }) => {
      setUser(data);
      const lang = data.language || "en";
      i18n.changeLanguage(lang);
      setServiceWorkerLanguage(lang);
      setTheme((data.theme as "system" | "light" | "dark") || "system");
    }).catch(() => {
      // Not authenticated yet or network error — fall back to cached values
      const lang = user?.language || i18n.language || "en";
      setServiceWorkerLanguage(lang);
    });
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    // Track standalone mode changes (app uninstalled)
    const mq = window.matchMedia("(display-mode: standalone)");
    const handleMQ = (e: MediaQueryListEvent) => setInstalled(e.matches);
    mq.addEventListener("change", handleMQ);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      mq.removeEventListener("change", handleMQ);
    };
  }, []);


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/challenge/:slug" element={<PublicChallenge />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route
          element={
            <RequireAuth>
              <RequireOnboarded>
                <Layout />
              </RequireOnboarded>
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<DailyTasks />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/new" element={<CreateChallenge />} />
          <Route path="/challenges/templates" element={<ChallengeTemplates />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/challenge/:id" element={<ChallengeReport />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/change-password" element={<ChangePassword />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
