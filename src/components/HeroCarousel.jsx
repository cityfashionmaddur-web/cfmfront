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
    const id = setInterval(nextSlide, 7000);
    return () => clearInterval(id);
  }, [slides.length, isPaused, nextSlide]);

  if (!slides.length) return null;

  return (
    <section
      className="relative h-[85vh] w-full overflow-hidden bg-ink text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-[0.25,1,0.5,1] ${
            idx === active ? "z-20 opacity-100" : "z-0 opacity-0"
          }`}
        >
          {/* Image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover object-center"
            style={{ 
              transform: idx === active ? "scale(1.05)" : "scale(1.15)", 
              transition: "transform 10s ease-out" 
            }}
            loading={idx === 0 ? "eager" : "lazy"}
          />

          {/* Gradient Overlay for stark contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
          <div className="absolute inset-0 bg-black/20" /> {/* Slight darkening for text pop */}

          {/* Content Container */}
          <div className="absolute inset-0 flex items-end justify-center px-6 pb-24 md:pb-32 lg:px-16 text-center">
            <div
              className={`flex w-full max-w-4xl flex-col items-center gap-6 transition-all duration-1000 delay-100 ${
                idx === active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">
                  {slide.badge || "Campaign"}
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold uppercase tracking-tighter leading-[0.9]">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="max-w-2xl mx-auto text-sm md:text-base font-medium uppercase tracking-[0.1em] text-white/80">
                    {slide.subtitle}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
                  {slide.ctas?.map((cta, i) => (
                    <Link
                      key={i}
                      to={cta.href}
                      className={cta.variant === "primary" ? "btn-primary bg-white text-ink hover:bg-gray-200" : "btn-secondary text-white border-white hover:bg-white hover:text-ink"}
                    >
                      {cta.label}
                    </Link>
                  ))}
                </div>
              </div>

              {(slide.caption || slide.tags?.length) && (
                <div className="hidden md:flex flex-wrap items-center justify-center gap-4 pt-8 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {slide.caption && (
                    <span>{slide.caption}</span>
                  )}
                  {slide.tags?.map((tag, tagIdx) => (
                    <span key={tagIdx}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Modern Minimal Navigation Controls */}
      <div className="absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 items-center justify-between px-4 sm:px-8 hidden md:flex pointer-events-none">
        <button
          onClick={prevSlide}
          className="pointer-events-auto p-4 text-white hover:text-gray-300 transition-colors"
          aria-label="Previous slide"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="square" strokeLinejoin="miter" d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="pointer-events-auto p-4 text-white hover:text-gray-300 transition-colors"
          aria-label="Next slide"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="square" strokeLinejoin="miter" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Minimal Progress Bar Indicators */}
      <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center gap-4">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className="group relative h-1 w-16 overflow-hidden bg-white/20 transition-all"
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div
              className={`absolute inset-0 bg-white origin-left ${
                idx === active && !isPaused ? "transition-transform duration-[7000ms] ease-linear scale-x-100" : "scale-x-0 transition-none"
              } ${idx === active && isPaused ? "scale-x-100 transition-none" : ""}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
