import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-12 admin-animate">
      <div className="h-24 w-24 rounded-[2.5rem] bg-amber-50 text-amber-500 flex items-center justify-center mb-10 shadow-xl shadow-amber-100/50 border border-amber-100">
         <AlertCircle size={48} strokeWidth={1.5} />
      </div>
      <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Boundary Limit Exceeded</h2>
      <p className="text-slate-500 font-bold max-w-md mx-auto mb-12 leading-relaxed">
        The administrative sector you are attempting to access does not exist within the current system parameters.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Link className="btn btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-indigo-100 font-black flex items-center gap-2 group" to="/admin">
          <Home size={18} />
          <span>Operations Center</span>
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-all p-3"
        >
          <ArrowLeft size={16} />
          <span>Recall Previous View</span>
        </button>
      </div>
    </div>
  );
}
