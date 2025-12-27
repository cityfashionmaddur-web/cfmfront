import React from "react";

export default function Contact() {
  return (
    <div className="space-y-8 pt-12">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Contact</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">We’re here to help</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Questions about orders, sizing, or shipping? Drop a note and our support team will respond within one business
          day.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Name
              <input className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Email
              <input type="email" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Subject
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Message
            <textarea
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send message
          </button>
        </form>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Support hours</h2>
          <p className="text-sm text-slate-600">Monday–Friday, 9am–6pm IST. We reply within one business day.</p>
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Email:</span> info@cityfashionmaddur.com</p>
            <p><span className="font-semibold text-slate-900">Phone:</span> +91 90000 00000</p>
            <p><span className="font-semibold text-slate-900">Address:</span> 21 Market Street, Mumbai</p>
          </div>
        </div>
      </div>
    </div>
  );
}
