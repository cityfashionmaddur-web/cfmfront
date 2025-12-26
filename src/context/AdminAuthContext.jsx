import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api.js";

const AdminAuthContext = createContext(null);
const STORAGE_KEY = "cityfashion_admin_auth_v1";

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return parsed;
  } catch (err) {
    console.error("Failed to load admin session", err);
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (session) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error("Failed to persist admin session", err);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.token || session?.user) return;
    let active = true;

    const hydrate = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/me`, {
          headers: { Authorization: `Bearer ${session.token}` },
          credentials: "include"
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            if (active) setSession(null);
          }
          return;
        }
        const data = await res.json();
        if (active) {
          setSession((prev) => (prev ? { ...prev, user: data } : prev));
        }
      } catch (err) {
        console.error("Failed to hydrate admin profile", err);
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, [session?.token, session?.user]);

  const loginWithCredentials = async (userId, password) => {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, password })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Admin login failed");
    }

    const data = await res.json();
    setSession({ token: data.token, user: data.user || null });
    return data;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/admin/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.warn("Admin logout failed", err);
    } finally {
      setSession(null);
    }
  };

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      loginWithCredentials,
      logout
    }),
    [session]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
