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
    <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24 space-y-16">
      
      <div className="border border-gray-200 p-8 md:p-12 lg:p-16 bg-gray-50/30 text-center">
        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 mb-6">Explore Curations</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black uppercase tracking-tighter text-ink mb-8 leading-none">
          The Collections
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto mb-10 font-medium">
          Navigate highly curated capsules and seasonal edits. Form and function engineered for the daily rhythm.
        </p>
        <Link
          to="/products"
          className="btn-primary inline-flex items-center justify-center"
        >
          View The Archive
        </Link>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="animate-pulse border border-gray-200 bg-gray-50/50 p-8 aspect-square flex flex-col justify-end">
              <div className="mb-4 h-4 w-24 bg-gray-200" />
              <div className="h-6 w-2/3 bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length ? (
            categories.map((category) => (
              <Link
                key={category.id}
                className="group relative border border-gray-200 bg-white p-8 aspect-[4/3] flex flex-col justify-between hover:border-ink transition-colors overflow-hidden"
                to={`/categories/${category.slug}`}
              >
                <div className="absolute inset-0 bg-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="h-12 w-12 border border-gray-200 flex items-center justify-center text-lg font-heading font-black text-ink uppercase bg-white group-hover:bg-ink group-hover:text-white transition-colors">
                    {(category.name || "C").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-ink transition-colors">
                    Explore →
                  </span>
                </div>
                
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-bold">{category._count?.products || 0} Pieces</p>
                  <h3 className="text-2xl font-heading font-black uppercase tracking-tight text-ink mb-3">{category.name}</h3>
                  <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">{category.description || "Curated precision and uncompromising aesthetic for this collection."}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center border border-gray-200 bg-gray-50/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No curations available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
