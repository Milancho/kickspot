import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";

/* Phase 4 implements real PIN entry against /config/admins. For the foundation
 * pass this screen just exposes the adminMode boundary so edit/delete controls
 * can be exercised end to end. */
export default function AdminMenu() {
  const navigate = useNavigate();
  const { adminMode, setAdminMode } = useAdmin();

  return (
    <div className="page">
      <PageHeader title="Admin" subtitle="Settings & access" />

      <div className="notice">
        Admin mode is {adminMode ? "unlocked" : "locked"}. PIN entry against
        Firestore arrives in Phase 4 — this toggle is a foundation stand-in.
      </div>

      <div className="card">
        <div className="list-row">
          <div className="name">Admin mode</div>
          <button
            className={"toggle-pill " + (adminMode ? "in" : "out")}
            onClick={() => setAdminMode(!adminMode)}
          >
            {adminMode ? "Unlocked" : "Locked"}
          </button>
        </div>
      </div>

      <button
        className="btn btn-ghost"
        style={{ marginTop: 12 }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
    </div>
  );
}
