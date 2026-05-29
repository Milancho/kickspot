import { createContext, useContext, useState } from "react";

/**
 * adminMode lives in memory only — it resets on page refresh by design.
 * This is the v1 security boundary: edit/delete controls are conditionally
 * rendered based on adminMode. PIN verification (Phase 4) flips it to true.
 */
const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [adminMode, setAdminMode] = useState(false);

  return (
    <AdminContext.Provider value={{ adminMode, setAdminMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}
