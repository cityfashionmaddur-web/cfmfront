import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function OAuthCallback() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const error = params.get("error");

    if (token) {
      login({ token, user: null });
      navigate("/profile", { replace: true });
      return;
    }

    const errorParam = error ? `?error=${encodeURIComponent(error)}` : "";
    navigate(`/login${errorParam}`, { replace: true });
  }, [login, navigate, search]);

  return <div className="loading">Completing sign-in...</div>;
}
