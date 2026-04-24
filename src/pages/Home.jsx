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


function mapHeroSlides(slides = []) {
  return slides
    .map((slide) => ({
      badge: slide.badge,
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      caption: slide.caption,
      targetHref: slide.cta1Href || slide.cta2Href,
      tags: slide.tags ? slide.tags.split(",").map((tag) => tag.trim()) : [],
      ctas: [
        slide.cta1Label && { label: slide.cta1Label, href: slide.cta1Href, variant: "primary" },
        slide.cta2Label && { label: slide.cta2Label, href: slide.cta2Href }
      ].filter(Boolean)
    }))
    .filter((slide) => slide.image);
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(1);
  const [slides, setSlides] = useState([]);
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
        setSlides(mappedSlides);
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
    <div className="pt-20 pb-32">
      {/* 1. Hero Section (Full Bleed) */}
      <HeroCarousel slides={slides} />

      {/* 2. Editorial Banner (High Contrast Break) */}
      <section className="bg-ink text-white py-24 lg:py-40 my-24 overflow-hidden relative">
        <div className="container mx-auto px-6 text-center max-w-4xl relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 block">
            The Exhibition
          </span>
          <h2 className="text-4xl lg:text-7xl font-heading font-black uppercase tracking-tighter mb-8 leading-[0.9]">
            Architectural Curations
          </h2>
          <p className="text-gray-300 mb-12 font-medium uppercase tracking-widest text-xs md:text-sm max-w-2xl mx-auto">
             A study in stark contrasts and refined structures. Explore the foundational garments defining the new season.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             {categories?.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="btn-secondary border-gray-600 text-white hover:border-white hover:bg-white hover:text-ink"
                >
                  {category.name}
                </Link>
             ))}
          </div>
        </div>
        {/* Subtle decorative typography in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none whitespace-nowrap overflow-hidden">
           <h2 className="text-[15rem] font-heading font-black uppercase tracking-tighter leading-none">CITYFASHION</h2>
        </div>
      </section>

      {/* 3. Main Product Feed */}
      <section className="container mx-auto px-6 lg:px-12">

        {/* Header & Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-3xl font-heading font-black uppercase tracking-tight text-ink">The Catalog</h2>
            <p className="text-gray-400 mt-2 text-xs font-bold uppercase tracking-widest">
              Page {page} // {pages}
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {SORT_OPTIONS.map((option) => {
              const params = new URLSearchParams({ page: "1", limit: String(PAGE_SIZE), sort: option.value });
              const isActive = option.value === sort;
              return (
                <Link
                  key={option.value}
                  to={`/?${params.toString()}`}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap border ${
                    isActive
                      ? "bg-ink text-white border-ink"
                      : "bg-transparent text-gray-500 border-gray-200 hover:border-ink hover:text-ink"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-6 mb-12 bg-red-50 text-red-600 font-bold uppercase tracking-widest text-xs text-center border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Minimal Editorial Pagination */}
        {pages > 1 && (
          <div className="flex justify-center mt-24">
            <div className="flex gap-4">
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
                    className={`w-12 h-12 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border ${
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
      </section>
    </div>
  );
}
