import React from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import AdminNav from "./AdminNav.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { LogOut, ShoppingCart, User as UserIcon } from "lucide-react";
import "../../styles/admin.css";

export default function AdminLayout() {
  const { isAuthenticated, user, logout } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <p className="admin-eyebrow">CITYFASHION</p>
          <h1 className="admin-brand">Studio</h1>
          <p className="admin-subtitle">Management Console</p>
        </div>
        
        <AdminNav />

        <div className="admin-sidebar-footer">
          <Link className="admin-link" to="/">
            <ShoppingCart size={18} />
            <span>Storefront</span>
          </Link>
          <button className="admin-link btn-ghost w-full" type="button" onClick={logout}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="flex items-center gap-3">
            <p className="admin-header-title">
              {location.pathname === "/admin" ? "Dashboard Overview" : "Admin Panel"}
            </p>
          </div>
          <div className="admin-header-actions flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800">{user?.name || "Administrator"}</span>
              <span className="text-[11px] text-slate-500 uppercase tracking-widest leading-none">{user?.role || "Owner"}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
              <UserIcon size={20} />
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
