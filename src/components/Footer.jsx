import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-ink border-t border-gray-800 pt-20 pb-10 text-white">
      <div className="container mx-auto px-6 lg:px-12">

        {/* Top Section: Brand & Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">

          {/* Brand Information (Takes up 4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <Link to="/" className="inline-flex items-center gap-4 text-2xl font-black uppercase tracking-[0.2em] font-heading">
              <span className="text-white">CityFashion</span>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-sm text-sm font-medium">
              Curated silhouettes and modern essentials for the city wardrobe. Designed for the contemporary minimalist.
            </p>
          </div>

          {/* Links Grid (Takes up 8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-10">

            {/* Column 1 */}
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-white">Shop</h4>
              <ul className="space-y-5 text-xs font-bold uppercase tracking-widest text-gray-500">
                <li><Link to="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link to="/categories" className="hover:text-white transition-colors">Collections</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-white">Support</h4>
              <ul className="space-y-5 text-xs font-bold uppercase tracking-widest text-gray-500">
                <li><Link to="/orders" className="hover:text-white transition-colors">Order Status</Link></li>
                <li><Link to="/policy" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-white">Company</h4>
              <ul className="space-y-5 text-xs font-bold uppercase tracking-widest text-gray-500">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Section: Copyright & Social */}
        <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            &copy; {new Date().getFullYear()} CITYFASHION. All rights reserved.
          </div>

          <div className="flex gap-8">
             <SocialIcon label="Instagram">
               <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
             </SocialIcon>
             <SocialIcon label="X">
               <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
             </SocialIcon>
             <SocialIcon label="Facebook">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
             </SocialIcon>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ label, children }) {
  return (
    <a
      href="#"
      className="w-4 h-4 text-gray-500 hover:text-white transition-colors"
      aria-label={label}
    >
      <svg fill="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </a>
  );
}
