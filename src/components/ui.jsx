import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext.jsx";

/** Shared page header with title, optional subtitle, and a settings gear
 *  that routes to the admin menu (PIN entry lives there in Phase 4). */
export function PageHeader({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { adminMode } = useAdmin();

  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      <div className="row-actions">
        {children}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("/admin")}
          title={adminMode ? "Admin menu (unlocked)" : "Admin / settings"}
        >
          {adminMode ? "🔓" : "⚙️"}
        </button>
      </div>
    </header>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="loading">
      <div className="spinner" />
      {label}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Tabs({ options, value, onChange }) {
  return (
    <div className="tabs">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={"tab" + (opt.value === value ? " active" : "")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Today's date as a "YYYY-MM-DD" string (local time). */
export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
