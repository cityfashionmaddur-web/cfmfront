import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="space-y-8 pt-12">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">About CITYFASHION MADDUR</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Crafted for the modern city</h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              CITYFASHION MADDUR curates silhouettes, fabrics, and finishes inspired by the rhythm of the city. We blend
              timeless essentials with statement pieces to keep your wardrobe ready for work, weekends, and everything in
              between.
            </p>
          </div>
          <Link
            to="/products"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Browse collection
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
            <p className="mt-2 text-sm text-slate-600">{item.copy}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Our materials</h2>
          <p className="mt-2 text-sm text-slate-600">
            We partner with mills that prioritize durability, comfort, and responsible sourcing. Every drop is tested for
            fit, longevity, and ease of care.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Design approach</h2>
          <p className="mt-2 text-sm text-slate-600">
            Minimal silhouettes, intentional details, and seasonless palettes. We ship fast, keep returns simple, and
            iterate based on community feedback.
          </p>
        </div>
      </div>
    </div>
  );
}

const highlights = [
  { title: "Responsible sourcing", copy: "We choose partners who prioritize low-impact production and ethical labor." },
  { title: "City-tested fits", copy: "Every piece is tested for movement, comfort, and durability in daily routines." },
  { title: "Customer-first support", copy: "Fast shipping, clear returns, and responsive care for every order." }
];
