import { Outlet } from "react-router-dom";
import TopNav from "../layout/TopNav";
import Sidebar from "../layout/Sidebar";
import BottomNav from "../layout/BottomNav";
import { useAuth } from "../../hooks/useAuth";
import "./admin.css";

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="app-frame admin-frame">
      <TopNav role="admin" onLogout={logout} />
      <div className="app-body admin-body">
        <Sidebar role="admin" assignedRoles={["admin"]} />
        <main className="main-surface admin-main">
          <Outlet />
        </main>
        <BottomNav role="admin" assignedRoles={["admin"]} />
      </div>
    </div>
  );
}
