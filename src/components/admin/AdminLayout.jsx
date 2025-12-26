import React from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import AdminNav from "./AdminNav.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
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
          <p className="admin-eyebrow">CITYFASHION MADDUR</p>
          <h1 className="admin-brand">Admin Studio</h1>
          <p className="admin-subtitle">Merch, orders, and stories</p>
        </div>
        <AdminNav />
        <div className="admin-sidebar-footer">
          <Link className="admin-link" to="/">
            View storefront
          </Link>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Admin Console</p>
            <p className="admin-header-title">Welcome back{user?.name ? `, ${user.name}` : ""}</p>
          </div>
          <div className="admin-header-actions">
            {user?.email && <span className="admin-header-meta">{user.email}</span>}
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
