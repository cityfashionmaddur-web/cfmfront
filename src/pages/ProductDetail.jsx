import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../utils/api.js";
import { formatPrice } from "../utils/format.js";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
// You can use lucide-react or heroicons. Using SVG directly here for zero-dep.
const ChevronDown = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const Minus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>;
const Plus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem, openDrawer } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for accordions
  const [openSection, setOpenSection] = useState("details");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const productResponse = await apiGet(`/store/products/${slug}`);
        if (!active) return;
        setProduct(productResponse);

        if (productResponse?.id) {
          const relatedResponse = await apiGet(`/store/products/related/${productResponse.id}`).catch(() => []);
          if (!active) return;
          setRelated(relatedResponse || []);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load product.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [slug]);

  const images = useMemo(
    () => (product?.productImages || []).map((img) => img.url).filter(Boolean),
    [product]
  );

  const inStock = product?.stock === undefined || product?.stock > 0;

  const handleAdd = () => {
    if (!product) return;
    const success = addItem(product, Number(quantity) || 1);
    if (success) openDrawer();
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (loading) return <ProductSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16 pt-12 lg:pb-0">

      {/* Breadcrumbs - Minimalist */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center text-xs font-medium uppercase tracking-widest text-slate-400">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          {product.category?.slug ? (
            <Link to={`/categories/${product.category.slug}`} className="hover:text-slate-900 transition-colors">
              {product.category.name}
            </Link>
          ) : <span>Products</span>}
        </nav>
      </div>

      <main className="container mx-auto px-4 lg:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16">

          {/* LEFT: Image Gallery (Stacked on Desktop, Carousel on Mobile) */}
          <div className="lg:col-span-7 xl:col-span-8 order-1 lg:order-1">
            {/* Desktop Grid Layout */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {images.length > 0 ? (
                images.map((url, idx) => (
                  <div key={idx} className={`relative overflow-hidden bg-slate-50 ${idx === 0 && images.length % 2 !== 0 ? 'col-span-2' : ''}`}>
                    <img
                      src={url}
                      alt={`${product.title} view ${idx + 1}`}
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 h-[600px] bg-slate-100 flex items-center justify-center text-slate-300">
                  No Images Available
                </div>
              )}
            </div>

            {/* Mobile Swipe Layout */}
            <div className="relative lg:hidden">
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-1">
                {images.length > 0 ? (
                  images.map((url, idx) => (
                    <div key={idx} className="snap-center min-w-[100vw] sm:min-w-[80vw] h-[50vh] bg-slate-50">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="w-full h-[50vh] bg-slate-100" />
                )}
              </div>
              {images.length > 1 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="pointer-events-auto rounded-full bg-white/80 p-2 text-slate-900 shadow"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="pointer-events-auto rounded-full bg-white/80 p-2 text-slate-900 shadow"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Product Info (Sticky Sidebar) */}
          <div className="lg:col-span-5 xl:col-span-4 order-2 lg:order-2 px-0 lg:px-0 mt-6 lg:mt-0">
            <div className="card-surface sticky top-8 space-y-8 p-6 shadow-2xl">

              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h1 className="heading-xl font-light tracking-tight text-slate-900">
                    {product.title}
                  </h1>
                  {product.rating && (
                    <span className="hidden lg:flex items-center gap-1 text-sm font-medium">
                      ★ {Number(product.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-xl lg:text-2xl font-medium text-slate-900">
                  {formatPrice(product.price)}
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 leading-relaxed font-light">
                {product.description || "Designed for modern living, this piece combines utility with understated elegance."}
              </p>

              {/* Action Area */}
              <div className="pt-4 border-t border-slate-100 space-y-6">

                {/* Quantity & Stock Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-900">Quantity</span>
                    <div className="flex items-center border border-slate-200 rounded-full px-2 py-1">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="p-2 text-slate-500 hover:text-slate-900 transition"
                      >
                        <Minus />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <button
                         onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                         className="p-2 text-slate-500 hover:text-slate-900 transition"
                      >
                        <Plus />
                      </button>
                    </div>
                  </div>
                  <div className={`text-xs font-medium uppercase tracking-wider ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {inStock ? (product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock') : 'Sold Out'}
                  </div>
                </div>

                {/* Desktop Add to Cart */}
                <button
                  onClick={handleAdd}
                  disabled={!inStock}
                  className="hidden lg:block w-full btn-primary h-14 text-center disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {inStock ? `Add to Cart - ${formatPrice(product.price * quantity)}` : 'Notify Me'}
                </button>

                {/* Mobile Fixed Bottom Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-slate-100 lg:hidden z-50 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{product.title}</p>
                    <p className="font-medium">{formatPrice(product.price)}</p>
                  </div>
                  <button
                     onClick={handleAdd}
                     disabled={!inStock}
                     className="flex-1 btn-primary h-12 text-center disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Information Accordions */}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100 mt-2">
                <AccordionItem
                  title="Details & Fit"
                  isOpen={openSection === 'details'}
                  onClick={() => toggleSection('details')}
                >
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 font-light">
                    <li>Premium fabric blend for all-day wear.</li>
                    <li>Tailored fit inspired by modern luxury labels.</li>
                    <li>Model is 6'1" and wears size M.</li>
                  </ul>
                </AccordionItem>
                <AccordionItem
                  title="Delivery & Returns"
                  isOpen={openSection === 'delivery'}
                  onClick={() => toggleSection('delivery')}
                >
                  <p className="text-slate-600 font-light">
                    Free standard shipping on orders over $100. Returns accepted within 30 days of delivery.
                  </p>
                </AccordionItem>
                <AccordionItem
                  title="Care Instructions"
                  isOpen={openSection === 'care'}
                  onClick={() => toggleSection('care')}
                >
                  <p className="text-slate-600 font-light">
                    Machine wash cold with like colors. Tumble dry low. Do not bleach.
                  </p>
                </AccordionItem>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Related Products Section - Cleaned up duplication */}
      {related.length > 0 && (
        <section className="container mx-auto px-4 py-24 border-t border-slate-100 mt-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-light text-slate-900">Curated for you</h2>
              <p className="text-slate-500 mt-1 font-light">Pieces you might also appreciate.</p>
            </div>
            <Link to="/products" className="hidden md:block text-sm font-medium border-b border-slate-900 pb-0.5 hover:opacity-70 transition-opacity">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {related.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
             <Link to="/products" className="btn-outline inline-flex justify-center">
               View All Products
             </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// Sub-components for cleaner code
function AccordionItem({ title, isOpen, onClick, children }) {
  return (
    <div className="py-4">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between text-left text-sm font-medium uppercase tracking-wider text-slate-900 hover:text-slate-600 transition-colors"
      >
        <span>{title}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="text-sm pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-slate-100 h-[60vh] w-full animate-pulse rounded-md"></div>
      </div>
      <div className="lg:col-span-4 space-y-6 mt-8 lg:mt-0">
        <div className="h-8 bg-slate-100 w-3/4 animate-pulse rounded"></div>
        <div className="h-6 bg-slate-100 w-1/4 animate-pulse rounded"></div>
        <div className="h-24 bg-slate-100 w-full animate-pulse rounded"></div>
        <div className="h-12 bg-slate-100 w-full animate-pulse rounded-full mt-8"></div>
      </div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-lg border border-rose-100">
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </div>
  );
}
