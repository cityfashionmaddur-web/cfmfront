import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { apiGet } from "../utils/api.js";

const PAGE_SIZE = 12;

function readParam(params, key) {
  return params.get(key) || "";
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(readParam(searchParams, "page")) || 1;
  const sort = readParam(searchParams, "sort") || "newest";
  const q = readParam(searchParams, "q");
  const min = readParam(searchParams, "min");
  const max = readParam(searchParams, "max");
  const category = readParam(searchParams, "category");

  const [pageState, setPageState] = useState(page);
  const [formState, setFormState] = useState({ q: "", min: "", max: "", sort: "newest", category: "" });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(10000);

  const PROFILE_KEY = "cityfashion.profile";

  useEffect(() => {
    try {
      const cached = localStorage.getItem(PROFILE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setProfileForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error("Failed to read profile hints", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profileForm));
    } catch (err) {
      console.error("Failed to persist profile hints", err);
    }
  }, [profileForm]);

  useEffect(() => {
    setFormState({ q, min, max, sort, category });
    setPageState(page);
    setProducts([]);
    setHasMore(false);
    setRangeMin(Number(min) || 0);
    setRangeMax(Number(max) || 10000);
  }, [q, min, max, sort, category, page]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(pageState),
      limit: String(PAGE_SIZE),
      sort
    });

    if (q) params.set("q", q);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (category) params.set("category", category);

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [productsResponse, categoryResponse] = await Promise.all([
          apiGet(`/store/products?${params.toString()}`),
          apiGet("/store/categories")
        ]);

        if (!active) return;
        const nextProducts = productsResponse.products || [];
        const nextPages = Math.max(productsResponse.pages || 1, 1);
        setProducts((prev) => (pageState === 1 ? nextProducts : [...prev, ...nextProducts]));
        setPages(nextPages);
        setHasMore(pageState < nextPages);
        setCategories(categoryResponse || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load products.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [pageState, sort, q, min, max, category]);

  const pagination = useMemo(() => Array.from({ length: pages }), [pages]);

  const updateParam = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    if (event) event.preventDefault();
    const next = new URLSearchParams();
    next.set("page", "1");
    next.set("limit", String(PAGE_SIZE));
    if (formState.sort) next.set("sort", formState.sort);
    if (formState.q) next.set("q", formState.q);
    if (formState.min) next.set("min", formState.min);
    if (formState.max) next.set("max", formState.max);
    if (formState.category) next.set("category", formState.category);
    setProducts([]);
    setPageState(1);
    setSearchParams(next);
    setShowFilters(false);
  };

  const handleReset = () => {
    setProducts([]);
    setPageState(1);
    setFormState({ q: "", min: "", max: "", sort: "newest", category: "" });
    setRangeMin(0);
    setRangeMax(10000);
    setSearchParams({});
  };

  const activeFilters = useMemo(() => {
    const chips = [];
    if (q) chips.push(`Search: ${q}`);
    if (category) chips.push(`Category: ${category}`);
    if (min) chips.push(`Min: ${min}`);
    if (max) chips.push(`Max: ${max}`);
    if (sort && sort !== "newest") chips.push(`Sort: ${sort}`);
    return chips;
  }, [q, category, min, max, sort]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = pageState + 1;
    setPageState(nextPage);
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    setSearchParams(params);
  };

  return (
    <div className="flex flex-col gap-12 pt-16 pb-24 container mx-auto px-6 lg:px-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black uppercase tracking-tighter text-ink">The Catalog</h1>
          <p className="text-gray-400 mt-2 text-xs font-bold uppercase tracking-widest">
            {products.length} Items // Page {pageState} of {pages}
          </p>
        </div>
        <Link className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink border-b border-ink pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors" to="/categories">
          Browse Collections
        </Link>
      </section>

      <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Mobile Filter Toggle */}
          <div className="flex flex-wrap items-center gap-4 md:hidden">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="btn-secondary w-full"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-ink underline underline-offset-4"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Desktop Filter Form */}
          <form
            className="hidden grid-cols-4 lg:grid-cols-5 gap-4 md:grid"
            onSubmit={handleSubmit}
          >
            <input
              className="px-4 py-3 text-xs font-bold uppercase tracking-widest border border-gray-200 text-ink placeholder-gray-400 focus:outline-none focus:border-ink transition-colors"
              placeholder="Search..."
              value={formState.q}
              onChange={(event) => updateParam("q", event.target.value)}
            />
            
            <select
              className="px-4 py-3 text-xs font-bold uppercase tracking-widest border border-gray-200 text-ink focus:outline-none focus:border-ink transition-colors appearance-none bg-transparent"
              value={formState.category}
              onChange={(event) => updateParam("category", event.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            
            <div className="flex items-center gap-2 border border-gray-200 px-4 py-3 focus-within:border-ink transition-colors">
              <input
                className="w-full text-xs font-bold uppercase tracking-widest text-ink placeholder-gray-400 focus:outline-none bg-transparent text-center"
                type="number"
                placeholder="Min"
                value={formState.min}
                onChange={(event) => updateParam("min", event.target.value)}
              />
              <span className="text-gray-300">-</span>
              <input
                className="w-full text-xs font-bold uppercase tracking-widest text-ink placeholder-gray-400 focus:outline-none bg-transparent text-center"
                type="number"
                placeholder="Max"
                value={formState.max}
                onChange={(event) => updateParam("max", event.target.value)}
              />
            </div>

            <select
              className="px-4 py-3 text-xs font-bold uppercase tracking-widest border border-gray-200 text-ink focus:outline-none focus:border-ink transition-colors appearance-none bg-transparent"
              value={formState.sort}
              onChange={(event) => updateParam("sort", event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price (Low)</option>
              <option value="price_desc">Price (High)</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                className="flex-1 btn-primary"
                type="submit"
              >
                Apply
              </button>
              {activeFilters.length > 0 && (
                <button
                  className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-ink transition-colors"
                  type="button"
                  onClick={handleReset}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {activeFilters.map((label, idx) => (
                <span
                  key={`${label}-${idx}`}
                  className="px-3 py-1 bg-gray-100 text-[9px] font-black uppercase tracking-widest text-ink"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 border border-red-200 bg-red-50 text-[10px] font-bold uppercase tracking-widest text-red-600 text-center">
              {error}
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="bg-gray-100 aspect-[3/4] w-full animate-pulse" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-3 bg-gray-100 w-1/2 animate-pulse" />
                    <div className="h-3 bg-gray-100 w-1/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16">
              {products.length ? (
                products.map((product) => <ProductCard key={product.id} product={product} />)
              ) : (
                <div className="col-span-full py-24 flex flex-col items-center justify-center text-center border border-gray-200 bg-gray-50/50">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">No matching pieces found.</p>
                  <button onClick={handleReset} className="btn-secondary">Reset Filters</button>
                </div>
              )}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-12">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn-secondary min-w-[200px]"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

          {!hasMore && pages > 1 && (
             <div className="flex justify-center pt-16 border-t border-gray-100 mt-8">
               <div className="flex gap-4">
                 {pagination.map((_, idx) => {
                   const params = new URLSearchParams({
                     page: String(idx + 1),
                     limit: String(PAGE_SIZE),
                     sort
                   });
                   if (q) params.set("q", q);
                   if (min) params.set("min", min);
                   if (max) params.set("max", max);
                   if (category) params.set("category", category);
                   
                   const isActive = idx + 1 === pageState;
                   return (
                     <Link
                       key={idx}
                       to={`/products?${params.toString()}`}
                       className={`w-12 h-12 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors border ${
                         isActive
                           ? "bg-ink text-white border-ink"
                           : "bg-transparent text-gray-400 border-gray-200 hover:border-ink hover:text-ink"
                       }`}
                     >
                       {String(idx + 1).padStart(2, '0')}
                     </Link>
                   );
                 })}
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
          <div
            className="w-full max-w-xs bg-white h-full overflow-y-auto p-6 flex flex-col animate-in slide-in-from-right"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-heading font-black tracking-tight text-ink uppercase">Filters</h3>
              <button
                type="button"
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-ink"
                onClick={() => setShowFilters(false)}
              >
                Close
              </button>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Search</label>
                <input
                  className="w-full border-b border-gray-200 bg-transparent px-0 py-2 text-sm font-medium text-ink focus:outline-none focus:border-ink transition-colors"
                  placeholder="Keywords..."
                  value={formState.q}
                  onChange={(event) => updateParam("q", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</label>
                <select
                  className="w-full border-b border-gray-200 bg-transparent px-0 py-2 text-sm font-medium text-ink focus:outline-none focus:border-ink transition-colors appearance-none"
                  value={formState.category}
                  onChange={(event) => updateParam("category", event.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Min Price</label>
                  <input
                    className="w-full border-b border-gray-200 bg-transparent px-0 py-2 text-sm font-medium text-ink focus:outline-none focus:border-ink transition-colors"
                    type="number"
                    value={formState.min}
                    onChange={(e) => updateParam("min", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Max Price</label>
                  <input
                    className="w-full border-b border-gray-200 bg-transparent px-0 py-2 text-sm font-medium text-ink focus:outline-none focus:border-ink transition-colors"
                    type="number"
                    value={formState.max}
                    onChange={(e) => updateParam("max", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sort By</label>
                <select
                  className="w-full border-b border-gray-200 bg-transparent px-0 py-2 text-sm font-medium text-ink focus:outline-none focus:border-ink transition-colors appearance-none"
                  value={formState.sort}
                  onChange={(event) => updateParam("sort", event.target.value)}
                >
                  <option value="newest">Newest Arriving</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="pt-8 space-y-3 mt-auto border-t border-gray-100">
              <button
                className="w-full btn-primary"
                type="button"
                onClick={handleSubmit}
              >
                Apply Filters
              </button>
              <button
                className="w-full btn-secondary"
                type="button"
                onClick={handleReset}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
