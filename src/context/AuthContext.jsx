import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "cityfashion_auth_v1";

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return parsed;
  } catch (err) {
    console.error("Failed to load auth session", err);
    return null;
  }
}

export function AuthProvider({ children }) {
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
      console.error("Failed to persist auth session", err);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.token || session?.user) return;
    let active = true;
    const controller = new AbortController();

    const hydrateProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${session.token}` },
          signal: controller.signal
        });
        if (!res.ok) {
          if ((res.status === 401 || res.status === 403) && active) {
            setSession(null);
          }
          return;
        }
        const data = await res.json();
        if (active) {
          setSession((prev) => (prev ? { ...prev, user: data } : prev));
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to hydrate profile", err);
      }
    };

    hydrateProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [session?.token, session?.user]);

  const login = (payload) => {
    setSession(payload);
  };

  const updateUser = (user) => {
    setSession((prev) => (prev ? { ...prev, user } : prev));
  };

  const logout = () => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
        if (session?.user?.email) {
          window.google.accounts.id.revoke(session.user.email, () => {});
        }
      } catch (err) {
        console.warn("Failed to revoke Google session", err);
      }
    }
    setSession(null);
  };

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      login,
      updateUser,
      logout
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
