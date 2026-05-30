import { createContext, useContext, useState } from "react";

/**
 * adminMode lives in memory only — it resets on page refresh by design.
 * This is the v1 security boundary: edit/delete controls are conditionally
 * rendered based on adminMode. PIN verification flips it to true and records
 * which admin is active.
 */
const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null); // { name, pin } or null

  const login = (adminRecord) => setAdmin(adminRecord);
  const logout = () => setAdmin(null);

  return (
    <AdminContext.Provider
      value={{ admin, adminMode: !!admin, login, logout }}
    >
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
