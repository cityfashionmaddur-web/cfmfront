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
    <div className="flex flex-col gap-8 pt-12">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">All Products</h1>
          <p className="text-slate-600">Search, filter by price, and paginate through the catalog.</p>
        </div>
        <Link className="text-sm font-semibold text-slate-800 underline-offset-4 hover:underline" to="/categories">
          Browse categories
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm"
            >
              {showFilters ? "Hide filters" : "Show filters"}
            </button>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-900"
              >
                Clear all
              </button>
            )}
          </div>

          <form
            className="hidden grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow md:grid"
            onSubmit={handleSubmit}
          >
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder="Search products"
              value={formState.q}
              onChange={(event) => updateParam("q", event.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              type="number"
              placeholder="Min price"
              value={formState.min}
              onChange={(event) => updateParam("min", event.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              type="number"
              placeholder="Max price"
              value={formState.max}
              onChange={(event) => updateParam("max", event.target.value)}
            />
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              value={formState.sort}
              onChange={(event) => updateParam("sort", event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600">Min</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  type="number"
                  value={formState.min}
                  onChange={(event) => {
                    updateParam("min", event.target.value);
                    setRangeMin(Number(event.target.value) || 0);
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600">Max</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  type="number"
                  value={formState.max}
                  onChange={(event) => {
                    updateParam("max", event.target.value);
                    setRangeMax(Number(event.target.value) || 10000);
                  }}
                />
              </div>
            </div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              value={formState.category}
              onChange={(event) => updateParam("category", event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3 lg:col-span-4">
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                type="submit"
              >
                Apply
              </button>
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-900"
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>

          {showFilters && (
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setShowFilters(false)}>
              <div
                className="absolute inset-y-0 right-0 w-full max-w-sm translate-x-0 overflow-y-auto rounded-l-3xl bg-white p-5 shadow-2xl transition duration-200"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-800"
                    onClick={() => setShowFilters(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-4">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Search products"
                    value={formState.q}
                    onChange={(event) => updateParam("q", event.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Min price</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        type="number"
                        value={formState.min}
                        onChange={(event) => {
                          updateParam("min", event.target.value);
                          setRangeMin(Number(event.target.value) || 0);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Max price</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                        type="number"
                        value={formState.max}
                        onChange={(event) => {
                          updateParam("max", event.target.value);
                          setRangeMax(Number(event.target.value) || 10000);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Price range</label>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>₹{rangeMin}</span>
                      <input
                        type="range"
                        min="0"
                        max="20000"
                        step="100"
                        value={rangeMin}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setRangeMin(value);
                          updateParam("min", String(value));
                        }}
                        className="h-1 flex-1 cursor-pointer accent-slate-900"
                      />
                      <input
                        type="range"
                        min="0"
                        max="20000"
                        step="100"
                        value={rangeMax}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setRangeMax(value);
                          updateParam("max", String(value));
                        }}
                        className="h-1 flex-1 cursor-pointer accent-slate-900"
                      />
                      <span>₹{rangeMax}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Sort</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      value={formState.sort}
                      onChange={(event) => updateParam("sort", event.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Category</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      value={formState.category}
                      onChange={(event) => updateParam("category", event.target.value)}
                    >
                      <option value="">All categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                      type="button"
                      onClick={handleSubmit}
                    >
                      Apply
                    </button>
                    <button
                      className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-900"
                      type="button"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((label, idx) => (
                <span
                  key={`${label}-${idx}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-lg">
                  <div className="mb-4 h-48 rounded-2xl bg-slate-200" />
                  <div className="mb-2 h-4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.length ? (
                products.map((product) => <ProductCard key={product.id} product={product} />)
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 shadow-inner">
                  No products match your filters yet.
                </div>
              )}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Show more"}
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
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

              return (
                <Link
                  key={idx}
                  to={`/products?${params.toString()}`}
                  className={
                    idx + 1 === pageState
                      ? "rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
                      : "rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-900"
                  }
                >
                  {idx + 1}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
