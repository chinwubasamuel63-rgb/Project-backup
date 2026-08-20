import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import TopNav from "../components/layout/TopNav";
import Sidebar from "../components/layout/Sidebar";
import BottomNav from "../components/layout/BottomNav";

export default function AppLayout() {
  const { user, logout } = useAuth();

  const role = user?.role || "student";

  const assignedRoles = [role];

  return (
    <div className="app-frame">
      <TopNav role={role} assignedRoles={assignedRoles} onLogout={logout} />

      <div className="app-body">
        {/* Sidebar hidden on mobile, shown on desktop */}
        <Sidebar role={role} assignedRoles={assignedRoles} />

        <main className="main-surface">
          <Outlet />
        </main>

        {/* Bottom nav shown on mobile, hidden on desktop */}
        <BottomNav role={role} assignedRoles={assignedRoles} />
      </div>
    </div>
  );
}
