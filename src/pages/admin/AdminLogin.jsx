import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminLogin() {
  const { isAuthenticated, user, loginWithCredentials } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ userId: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "" });

  const from = location.state?.from?.pathname || "/admin";

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    try {
      await loginWithCredentials(form.userId.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Admin login failed" });
    }
  };

  if (isAuthenticated) {
    return (
      <div className="admin-login-shell">
        <div className="panel panel-stack admin-animate">
          <p className="admin-eyebrow">Already signed in</p>
          <h1 className="admin-login-title">Welcome back</h1>
          <p className="admin-login-subtitle">You are signed in as {user?.name || user?.email || "Admin"}.</p>
          <div className="panel-actions">
            <Link className="btn btn-primary" to="/admin">
              Go to dashboard
            </Link>
            <Link className="btn btn-outline" to="/">
              Visit storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-shell">
      <div className="panel admin-animate">
        <div className="admin-login-header">
          <p className="admin-eyebrow">Admin access</p>
          <h1 className="admin-login-title">Sign in</h1>
          <p className="admin-login-subtitle">
            Use the admin credentials from your backend environment. Google OAuth stays for shoppers.
          </p>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Admin ID</span>
            <input
              className="input"
              value={form.userId}
              onChange={handleChange("userId")}
              placeholder="Enter admin user ID"
              required
            />
          </label>

          <label className="admin-field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Enter admin password"
              required
            />
          </label>

          {status.error && <div className="alert">{status.error}</div>}

          <button className="btn btn-primary" type="submit" disabled={status.loading}>
            {status.loading ? "Signing in..." : "Sign in as admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
