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

  const oauthError = useMemo(() => {
    const params = new URLSearchParams(search);
    const error = params.get("error");
    if (!error) return "";
    if (error === "oauth_failed") return "Google sign-in failed. Please try again.";
    if (error === "missing_code") return "Google sign-in was cancelled or incomplete.";
    return "Google sign-in failed.";
  }, [search]);

  useEffect(() => {
    if (oauthError) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [oauthError, navigate]);

  const handleGoogleLogin = () => {
    setLoading(true);
    const returnTo = new URLSearchParams(search).get("returnTo");
    if (returnTo) {
      sessionStorage.setItem("returnTo", returnTo);
    } else {
      sessionStorage.removeItem("returnTo");
    }
    const redirectUrl = `${window.location.origin}/oauth/callback`;
    const url = new URL(`${API_BASE}/auth/google/redirect`);
    url.searchParams.set("redirect", redirectUrl);
    window.location.href = url.toString();
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center border border-gray-200 p-12 max-w-md w-full">
          <CheckCircle className="h-8 w-8 text-ink mx-auto mb-6" />
          <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-ink">Already Signed In</h2>
          <p className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">Access granted.</p>
          <div className="mt-8 flex flex-col gap-4">
            <Link
              to="/profile"
              className="btn-primary w-full"
            >
              View Profile
            </Link>
            <Link
              to="/"
              className="btn-secondary w-full"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-24 px-6">
      <div className="w-full max-w-md bg-white border border-gray-200 p-10 relative">
        
        {animateSuccess && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/95 backdrop-blur-sm">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-ink mx-auto mb-4" />
              <h3 className="text-lg font-heading font-black uppercase tracking-tight text-ink">Authenticated</h3>
              <p className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Redirecting...</p>
            </div>
          </div>
        )}

        <div className="space-y-10">
          <div className="text-center">
            <h1 className="text-3xl font-heading font-black uppercase tracking-tight text-ink mb-4">Authentication</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Secure access for curation and checkout.
            </p>
          </div>

          {oauthError && (
            <div className="border border-red-200 bg-red-50 p-4 text-center">
              <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">{oauthError}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-ink bg-white hover:bg-ink hover:text-white transition-colors text-ink px-6 py-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Chrome size={20} />}
            <span className="text-xs font-bold uppercase tracking-widest">Continue with Google</span>
          </button>

          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">The Lookbook Advantage</p>
            <ul className="space-y-2 text-[10px] font-medium text-gray-500">
              <li>One-tap editorial checkout.</li>
              <li>Synced curation across devices.</li>
              <li>Zero passwords.</li>
            </ul>
          </div>

          <div className="text-center pt-8 text-[9px] font-bold uppercase tracking-widest text-gray-400">
            By authenticating, you accept our <Link to="/terms" className="text-ink underline hover:no-underline">Terms</Link> & <Link to="/privacy" className="text-ink underline hover:no-underline">Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
