import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

export default function HeroCarousel({ slides = [] }) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setActive((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length || isPaused) return;
    const id = setInterval(nextSlide, 6000);
    return () => clearInterval(id);
  }, [slides.length, isPaused, nextSlide]);

  if (!slides.length) return null;

  return (
    <section
      className="relative isolate h-[78vh] w-full overflow-hidden rounded-3xl bg-slate-900 text-white shadow-[0_24px_120px_rgba(15,23,42,0.35)] ring-1 ring-white/10 md:h-[85vh]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-500/30 via-cyan-400/20 to-transparent blur-[110px]" />
      <div className="pointer-events-none absolute -right-10 bottom-[-30%] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-rose-500/25 via-purple-500/20 to-transparent blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.05),transparent_26%)]" />

      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            idx === active ? "z-20 opacity-100" : "z-0 opacity-0"
          }`}
        >
          {/* Image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover object-center"
            style={{ transform: idx === active ? "scale(1.02)" : "scale(1.12)", transition: "transform 9s ease-out" }}
            loading={idx === 0 ? "eager" : "lazy"}
          />

          {/* Gradient Overlay (Scrim) for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-900/70" />

          {/* Content Container */}
          <div className="absolute inset-0 flex items-center justify-center px-4 pb-16 pt-12 sm:px-8 md:px-12 lg:px-16">
            <div
              className={`flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white/5 p-6 backdrop-blur-md transition-all duration-700 md:p-10 ${
                idx === active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                  {slide.badge || "CITYFASHION MADDUR"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
                  {isPaused ? "Autoplay paused" : "Autoplay on"}
                </span>
              </div>

              <div className="space-y-4 md:space-y-6">
                <h1 className="text-4xl font-light leading-tight drop-shadow-2xl md:text-6xl lg:text-7xl">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="max-w-2xl text-base font-light text-slate-100/90 md:text-lg">
                    {slide.subtitle}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {slide.ctas?.map((cta, i) => (
                    <Link
                      key={i}
                      to={cta.href}
                      className={`min-w-[160px] rounded-full px-7 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ${
                        cta.variant === "primary"
                          ? "bg-white text-slate-900 shadow-lg shadow-white/20 hover:-translate-y-0.5 hover:bg-slate-100"
                          : "border border-white/60 text-white hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
                      }`}
                    >
                      {cta.label}
                    </Link>
                  ))}
                </div>
              </div>

              {(slide.caption || slide.tags?.length) && (
                <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-white/70">
                  {slide.caption && (
                    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                      {slide.caption}
                    </span>
                  )}
                  {slide.tags?.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Controls (Hidden on mobile, visible on desktop hover) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 sm:px-8 lg:px-12">
        <button
          onClick={prevSlide}
          className="pointer-events-auto hidden rounded-full border border-white/20 bg-white/10 p-3 text-white/80 backdrop-blur hover:border-white hover:text-white lg:inline-flex"
          aria-label="Previous slide"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="pointer-events-auto hidden rounded-full border border-white/20 bg-white/10 p-3 text-white/80 backdrop-blur hover:border-white hover:text-white lg:inline-flex"
          aria-label="Next slide"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Progress Bar Indicators */}
      <div className="absolute bottom-7 left-0 right-0 z-30 flex justify-center gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`group relative h-1.5 w-12 overflow-hidden rounded-full transition-all ${
              idx === active ? "bg-white/80" : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div
              className={`absolute inset-0 bg-white transition-transform duration-[6000ms] linear origin-left ${
                idx === active && !isPaused ? "scale-x-100" : "scale-x-0"
              } ${idx === active && isPaused ? "w-full" : ""}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
