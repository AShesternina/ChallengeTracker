import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { setServiceWorkerLanguage } from "./services/sw-lang";
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

  // On startup: sync language to SW from persisted user state
  useEffect(() => {
    const lang = user?.language || i18n.language || "en";
    setServiceWorkerLanguage(lang);
  }, []);


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/challenge/:id" element={<ChallengeReport />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
