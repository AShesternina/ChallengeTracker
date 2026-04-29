import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
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
