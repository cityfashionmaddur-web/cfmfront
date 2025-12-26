import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-12">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-inner max-w-lg">
        <h2 className="text-3xl font-semibold">Page not found</h2>
        <p className="text-slate-600">The page you requested doesn't exist. Let's get you back on track.</p>
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg" to="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
