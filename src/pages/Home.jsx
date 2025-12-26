import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { apiGet } from "../utils/api.js";

const PAGE_SIZE = 8;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" }
];

// ... (Keep your existing fallbackSlides and mapHeroSlides helper functions exactly as they were) ...
const fallbackSlides = [
  {
    badge: "New Season",
    title: "Signature silhouettes made for the city.",
    subtitle: "Layerable textures, sculpted tailoring, and bold accessories.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80",
    caption: "City Capsule '24",
    tags: ["Tailored", "Monochrome"],
    ctas: [{ label: "Shop capsule", href: "/products?sort=newest", variant: "primary" }]
  },
  {
    badge: "Limited drop",
    title: "Evening edit with luminous details.",
    subtitle: "Draped silhouettes and metallic accents curated for after-hours.",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
    caption: "Evening Stories",
    tags: ["Metallic", "Occasion"],
    ctas: [{ label: "Shop evening", href: "/products?sort=price_desc", variant: "primary" }]
  }
];

function mapHeroSlides(slides = []) {
  return slides
    .map((slide) => ({
      badge: slide.badge,
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      caption: slide.caption,
      tags: slide.tags ? slide.tags.split(",").map((tag) => tag.trim()) : [],
      ctas: [
        slide.cta1Label && { label: slide.cta1Label, href: slide.cta1Href, variant: "primary" },
        slide.cta2Label && { label: slide.cta2Label, href: slide.cta2Href }
      ].filter(Boolean)
    }))
    .filter((slide) => slide.title && slide.image);
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(1);
  const [slides, setSlides] = useState(fallbackSlides);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort
    });

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [productsResponse, categoryResponse, heroResponse] = await Promise.all([
          apiGet(`/store/products?${params.toString()}`),
          apiGet("/store/categories"),
          apiGet("/store/hero").catch(() => [])
        ]);

        if (!active) return;
        setProducts(productsResponse.products || []);
        setPages(Math.max(productsResponse.pages || 1, 1));
        setCategories(categoryResponse || []);
        const mappedSlides = mapHeroSlides(heroResponse || []);
        setSlides(mappedSlides.length ? mappedSlides : fallbackSlides);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load storefront data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [page, sort]);

  const pagination = useMemo(() => Array.from({ length: pages }), [pages]);

  return (
    <div className="pt-12 pb-20">
      {/* 1. Hero Section (Full Bleed) */}
      <HeroCarousel slides={slides} />

      {/* 2. Editorial Banner (High Contrast Break) */}
      <section className="bg-slate-900 text-white py-16 lg:py-24 my-12">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 block">
            The Edit
          </span>
          <h2 className="text-3xl lg:text-5xl font-serif font-light mb-6 leading-tight">
            Textured layers & sculpted tailoring.
          </h2>
          <p className="text-slate-300 mb-8 font-light text-lg">
             A curation of our favorite pieces for the transitioning season.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
             {categories?.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="px-6 py-2 border border-white/20 rounded-full hover:bg-white hover:text-slate-900 transition-colors text-sm font-medium"
                >
                  {category.name}
                </Link>
             ))}
          </div>
        </div>
      </section>

      {/* 3. Main Product Feed */}
      <section className="container mx-auto px-4 lg:px-8">

        {/* Header & Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-light text-slate-900">New Arrivals</h2>
            <p className="text-slate-500 mt-1 text-sm">
              Page {page} of {pages}
            </p>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
            {SORT_OPTIONS.map((option) => {
              const params = new URLSearchParams({ page: "1", limit: String(PAGE_SIZE), sort: option.value });
              const isActive = option.value === sort;
              return (
                <Link
                  key={option.value}
                  to={`/?${params.toString()}`}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-rose-50 text-rose-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="space-y-4">
                <div className="bg-slate-100 aspect-[4/5] w-full animate-pulse" />
                <div className="h-4 bg-slate-100 w-2/3 animate-pulse" />
                <div className="h-4 bg-slate-100 w-1/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Minimal Pagination */}
        {pages > 1 && (
          <div className="flex justify-center mt-16 border-t border-slate-100 pt-8">
            <div className="flex gap-2">
              {pagination.map((_, idx) => {
                const params = new URLSearchParams({
                  page: String(idx + 1),
                  limit: String(PAGE_SIZE),
                  sort
                });
                const isActive = idx + 1 === Number(page);
                return (
                  <Link
                    key={idx}
                    to={`/?${params.toString()}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {idx + 1}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
