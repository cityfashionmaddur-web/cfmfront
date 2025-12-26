import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../utils/api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function CategoryDetail() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet(`/store/categories/${slug}`);
        if (!active) return;
        setCategory(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load category.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="flex flex-col gap-8 pt-12">
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-lg">
              <div className="mb-3 h-48 rounded-xl bg-slate-200" />
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {category && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <Link className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm" to="/">
            Home
          </Link>
          <span className="text-slate-400">/</span>
          <Link className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm" to="/categories">
            Categories
          </Link>
          <span className="text-slate-400">/</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm text-slate-800">
            {category.name}
          </span>
        </div>
      )}

      {category && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{category.name}</h1>
              <p className="text-slate-600">{category.description || "Curated pieces from this collection."}</p>
            </div>
            <Link className="text-sm font-semibold text-slate-800 underline-offset-4 hover:underline" to="/products">
              Shop all
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {category.products?.length ? (
              category.products.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 shadow-inner">
                No products in this category yet.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
