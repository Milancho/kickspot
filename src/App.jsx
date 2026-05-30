import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import UpdatePrompt from "./components/UpdatePrompt.jsx";
import Standings from "./pages/Standings.jsx";
import Players from "./pages/Players.jsx";
import Availability from "./pages/Availability.jsx";
import Teams from "./pages/Teams.jsx";
import Matches from "./pages/Matches.jsx";
import Reports from "./pages/Reports.jsx";
import AdminMenu from "./pages/AdminMenu.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const NAV_ITEMS = [
  { to: "/standings", label: "Standings", icon: "🏆" },
  { to: "/players", label: "Players", icon: "👤" },
  { to: "/availability", label: "Available", icon: "✅" },
  { to: "/teams", label: "Teams", icon: "🛡️" },
  { to: "/matches", label: "Matches", icon: "⚽" },
  { to: "/reports", label: "Reports", icon: "📊" },
];

function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            "nav-item" + (isActive ? " active" : "")
          }
        >
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <div className="app">
      <UpdatePrompt />
      <Routes>
        <Route path="/" element={<Navigate to="/standings" replace />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/players" element={<Players />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<AdminMenu />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/standings" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
