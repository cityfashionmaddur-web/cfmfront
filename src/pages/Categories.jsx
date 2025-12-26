import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../utils/api.js";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/store/categories");
        if (!active) return;
        setCategories(data || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load categories.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 pt-12">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Explore</p>
            <h1 className="text-3xl font-semibold">Shop by category</h1>
            <p className="text-sm text-white/75">Navigate curated collections and seasonal edits for every wardrobe.</p>
          </div>
          <Link
            to="/products"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            View all products
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-white/80 p-5 shadow">
              <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
              <div className="mb-2 h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-200" />
              <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length ? (
            categories.map((category) => (
              <Link
                key={category.id}
                className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                to={`/categories/${category.slug}`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-900">
                    {(category.name || "C").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Category</p>
                    <h3 className="text-xl font-semibold text-slate-900">{category.name}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 line-clamp-2">{category.description || "Curated pieces for this collection."}</p>
                <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{category._count?.products || 0} products</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition">
                    Browse
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 shadow-inner">
              No categories yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
