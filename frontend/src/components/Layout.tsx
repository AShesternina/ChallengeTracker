import { NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/daily", label: "Today", icon: "📋" },
  { to: "/challenges", label: "Challenges", icon: "🎯" },
  { to: "/reports", label: "Reports", icon: "📊" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-xl font-bold tracking-tight">ChallengeTracker</h1>
      </header>

      <main className="flex-1 container mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 shadow-lg">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
