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
    <div className="relative pb-8 sm:pb-0 w-full bg-white">
      <section
        className="relative aspect-[16/9] sm:aspect-auto sm:h-[80vh] md:h-[85vh] w-full overflow-hidden bg-gray-50 text-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-[0.25,1,0.5,1] ${
            idx === active ? "z-20 opacity-100" : "z-0 opacity-0 pointer-events-none"
          }`}
        >
          {slide.targetHref ? (
            <Link to={slide.targetHref} className="block w-full h-full cursor-pointer relative group">
               <img
                  src={slide.image}
                  alt={slide.title || "Latest Arrivals"}
                  className="h-full w-full object-cover object-center"
                  style={{ 
                    transform: idx === active ? "scale(1.00)" : "scale(1.05)", 
                    transition: "transform 10s ease-out" 
                  }}
                  loading={idx === 0 ? "eager" : "lazy"}
               />
               <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors duration-700" />
               <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 px-6 z-10">
                 {slide.ctas && slide.ctas.length > 0 && (
                   <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                     {slide.ctas.map((cta, i) => (
                        <div key={i} className={`flex items-center justify-center ${cta.variant === 'primary' ? 'bg-white text-ink hover:bg-gray-100' : 'bg-transparent border border-white text-white hover:bg-white/10'} px-6 sm:px-10 py-4 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all`}>
                          {cta.label}
                        </div>
                     ))}
                   </div>
                 )}
               </div>
            </Link>
          ) : (
            <div className="w-full h-full relative">
              <img
                src={slide.image}
                alt={slide.title || "Latest Arrivals"}
                className="h-full w-full object-cover object-center"
                style={{ 
                  transform: idx === active ? "scale(1.00)" : "scale(1.05)", 
                  transition: "transform 10s ease-out" 
                }}
                loading={idx === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 px-6 z-10">
                 {slide.ctas && slide.ctas.length > 0 && (
                   <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                     {slide.ctas.map((cta, i) => (
                        <Link to={cta.href} key={i} className={`flex items-center justify-center ${cta.variant === 'primary' ? 'bg-white text-ink hover:bg-gray-100' : 'bg-transparent border border-white text-white hover:bg-white/10'} px-6 sm:px-10 py-4 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all pointer-events-auto`}>
                          {cta.label}
                        </Link>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          )}
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
      </section>

      {/* Minimal Progress Bar Indicators */}
      <div className="absolute bottom-2 sm:bottom-10 left-0 right-0 z-30 flex justify-center gap-4">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className="group relative h-1.5 w-12 sm:h-1 sm:w-16 overflow-hidden bg-gray-300 sm:bg-white/20 transition-all"
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div
              className={`absolute inset-0 bg-ink sm:bg-white origin-left ${
                idx === active && !isPaused ? "transition-transform duration-[7000ms] ease-linear scale-x-100" : "scale-x-0 transition-none"
              } ${idx === active && isPaused ? "scale-x-100 transition-none" : ""}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
