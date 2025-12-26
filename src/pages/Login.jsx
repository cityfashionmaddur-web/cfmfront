import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { API_BASE } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);

  // Handle OAuth errors from URL
  const oauthError = useMemo(() => {
    const params = new URLSearchParams(search);
    const error = params.get("error");
    if (!error) return "";
    if (error === "oauth_failed") return "Google sign-in failed. Please try again.";
    if (error === "missing_code") return "Google sign-in was cancelled or incomplete.";
    return "Google sign-in failed.";
  }, [search]);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (oauthError) {
      const timer = setTimeout(() => {
        // Clear error from URL without refresh
        navigate('/login', { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [oauthError, navigate]);

  // Handle Google Redirect
  const handleGoogleLogin = () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/oauth/callback`;
    const url = new URL(`${API_BASE}/auth/google/redirect`);
    url.searchParams.set("redirect", redirectUrl);
    window.location.href = url.toString();
  };

  // If already logged in, show a simple redirect state or message
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="text-center transition-all duration-300">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">You're already signed in</h2>
          <p className="mt-2 text-slate-600">Redirecting you to the dashboard...</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/products"
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
            >
              Go to Products
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.1),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.12),transparent_24%)]" />
      <div className="container relative mx-auto flex min-h-screen items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_24px_120px_rgba(15,23,42,0.15)] backdrop-blur">
          {animateSuccess && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-white/95">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-emerald-200/60">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Signed in</h3>
                <p className="mt-1 text-sm text-slate-600">Redirecting to your account…</p>
              </div>
            </div>
          )}

          <div className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">CITYFASHION MADDUR</p>
              <h1 className="text-3xl font-semibold text-slate-900">Sign in with Google</h1>
              <p className="text-sm text-slate-600">
                Fast, secure access for your cart, orders, and profile.
              </p>
            </div>

            {oauthError && (
              <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Google sign-in error</p>
                  <p className="m-0 text-rose-600">{oauthError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/8 via-sky-500/10 to-indigo-500/8 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {loading ? <Loader2 className="animate-spin text-indigo-600" size={22} /> : <Chrome size={22} />}
              <span className="relative font-semibold">Continue with Google</span>
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Why Google?</p>
              <ul className="mt-2 space-y-1 text-slate-600">
                <li>• One-tap checkout across devices.</li>
                <li>• Sessions stay synced with your cart and orders.</li>
                <li>• No passwords to remember.</li>
              </ul>
            </div>

            <div className="text-center text-xs text-slate-500">
              By continuing you agree to our{" "}
              <Link to="/terms" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Privacy
              </Link>
              . Encrypted with TLS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
