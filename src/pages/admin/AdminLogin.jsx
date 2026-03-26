import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";

export default function AdminLogin() {
  const { isAuthenticated, user, loginWithCredentials } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ userId: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [showPassword, setShowPassword] = useState(false);

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
      setStatus({ loading: false, error: err.message || "Credential validation failed." });
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-indigo-100 flex flex-col items-center text-center admin-animate">
          <div className="h-20 w-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mb-8 shadow-xl shadow-indigo-200">
             <ShieldCheck size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Authenticated</h1>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Welcome back, <span className="text-indigo-600 font-black">{user?.name || user?.email || "Administrator"}</span>. <br />
            Your session is currently active.
          </p>
          <div className="flex flex-col w-full gap-4">
            <Link className="btn btn-primary py-4 rounded-2xl font-black shadow-lg" to="/admin">
              Enter Operations
            </Link>
            <Link className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors" to="/">
              Back to storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-white">
      <div className="w-full max-w-md admin-animate">
        <div className="text-center mb-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Lock size={12} />
              <span>Enclave Secure Access</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3 italic">CityFashion</h1>
           <p className="text-slate-500 font-bold text-sm">Elevated Administration • v2.0</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-indigo-200/50 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none">
              <Sparkles size={64} />
           </div>

           <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Operator ID</label>
               <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                     <User size={18} />
                  </div>
                  <input
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800"
                    value={form.userId}
                    onChange={handleChange("userId")}
                    placeholder="Reference name..."
                    required
                  />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Authorization Code</label>
               <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                     <Lock size={18} />
                  </div>
                  <input
                    className="w-full pl-14 pr-14 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
               </div>
             </div>

             {status.error && (
               <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-bold text-xs animate-in fade-in slide-in-from-top-2">
                 {status.error}
               </div>
             )}

             <button className="w-full btn btn-primary py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]" type="submit" disabled={status.loading}>
               {status.loading ? (
                 <div className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <>
                   <span>Initialize Session</span>
                   <ArrowRight size={18} />
                 </>
               )}
             </button>
           </form>
        </div>
        
        <p className="mt-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">
          Authorized personnel only. <br />
          All system interactions are audited.
        </p>
      </div>
    </div>
  );
}
