import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE } from "../utils/api.js";

export default function OAuthCallback() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const error = params.get("error");
    let active = true;

    if (token) {
      const finishLogin = async () => {
        try {
          const res = await fetch(`${API_BASE}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!active) return;
          
          if (res.ok) {
            const userData = await res.json();
            login({ token, user: userData });

            let returnTo = sessionStorage.getItem("returnTo") || "/profile";
            sessionStorage.removeItem("returnTo");

            // Profile completion check
            const hasAddress = Boolean(
              userData.addressLine1?.trim() &&
              userData.city?.trim() &&
              userData.phone?.trim() &&
              userData.postalCode?.trim()
            );

            if (!hasAddress) {
              returnTo = "/profile";
            }

            navigate(returnTo, { replace: true });
          } else {
             navigate('/login?error=token_failed', { replace: true });
          }
        } catch(e) {
          if (active) navigate('/login?error=network', { replace: true });
        }
      };
      finishLogin();
      return () => { active = false; };
    }

    const errorParam = error ? `?error=${encodeURIComponent(error)}` : "";
    navigate(`/login${errorParam}`, { replace: true });
  }, [login, navigate, search]);

  return <div className="loading">Completing sign-in...</div>;
}
