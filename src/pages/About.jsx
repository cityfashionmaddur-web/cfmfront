import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="container mx-auto px-6 lg:px-12 py-24 space-y-24 text-ink">
      
      <div className="border border-gray-200 p-8 md:p-16 bg-gray-50/30 text-center">
        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 mb-6">About Us</p>
        <h1 className="text-4xl md:text-6xl font-heading font-black uppercase tracking-tighter text-ink mb-8 max-w-4xl mx-auto leading-none">
          Form.<br/>Function.<br/>Future.
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          We curate silhouettes, fabrics, and finishes inspired by the stark contrast and constant motion of the modern city. Our aesthetic merges high fashion with everyday utility, building a wardrobe engineered for intent.
        </p>
        <Link
          to="/products"
          className="btn-primary inline-flex items-center justify-center px-8"
        >
          View The Archive
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="border-t border-ink pt-6"
          >
            <h3 className="text-[11px] font-black uppercase tracking-widest text-ink mb-4">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.copy}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-12 border-t border-gray-200 pt-24">
        <div>
          <h2 className="text-2xl font-heading font-black uppercase tracking-tighter text-ink mb-6">Material Sourcing</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-md font-medium">
            We partner with mills that prioritize structural integrity and long-lasting dye fastness. Every fabric drop is subjected to rigorous testing for longevity, ensuring our pieces transition seasons effortlessly.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-heading font-black uppercase tracking-tighter text-ink mb-6">Design Philosophy</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-md font-medium">
            Minimal distraction. Maximum impact. Our design approach deletes the unnecessary, leaving behind refined lines and deliberate details. We produce in limited runs to eliminate waste and maintain exclusivity.
          </p>
        </div>
      </div>
    </div>
  );
}

const highlights = [
  { title: "Ethical Production", copy: "We strictly audit our partners, demanding low-impact production and fair labor compliance without exception." },
  { title: "Engineered Fit", copy: "Every silhouette undergoes multiple fitting rounds to ensure architectural drape and unhindered motion." },
  { title: "Direct Service", copy: "Uncompromising support. Transparent policies, streamlined returns, and direct responses to every inquiry." }
];

