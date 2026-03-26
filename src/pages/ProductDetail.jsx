import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../utils/api.js";
import { formatPrice } from "../utils/format.js";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";

const ChevronDown = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="m6 9 6 6 6-6"/></svg>;
const Minus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M5 12h14"/></svg>;
const Plus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem, openDrawer } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openSection, setOpenSection] = useState("details");
  const [selectedSize, setSelectedSize] = useState("");

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

  const hasVariants = product?.variants && product.variants.length > 0;
  
  const inStock = hasVariants
    ? (selectedSize 
       ? product.variants.find(v => v.size === selectedSize)?.stock > 0 
       : product.variants.some(v => v.stock > 0))
    : (product?.stock === undefined || product?.stock > 0);

  const getStockCount = () => {
    if (hasVariants && selectedSize) {
      return product.variants.find(v => v.size === selectedSize)?.stock || 0;
    }
    return product?.stock || 0;
  };

  const handleAdd = () => {
    if (!product) return;
    if (hasVariants && !selectedSize) {
      alert("Please select a size before adding to cart.");
      return;
    }
    const success = addItem(product, Number(quantity) || 1, selectedSize);
    if (success) openDrawer();
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.title,
      text: "Check out this piece from Cityfashion Maddur.",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!"); 
      }
    } catch (err) {
      console.warn("Share failed (or user cancelled):", err);
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (loading) return <ProductSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white text-ink pb-24 pt-16 lg:pb-32">

      {/* Breakpoint Container Navbar -> Content offset */}
      <div className="container mx-auto px-6 lg:px-12 py-6">
        <nav className="flex items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span className="mx-3">/</span>
          {product.category?.slug ? (
            <Link to={`/categories/${product.category.slug}`} className="hover:text-ink transition-colors">
              {product.category.name}
            </Link>
          ) : <span>Products</span>}
          <span className="mx-3">/</span>
          <span className="text-ink truncate">{product.title}</span>
        </nav>
      </div>

      <main className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24">

          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7 xl:col-span-8 order-1">
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {images.length > 0 ? (
                images.map((url, idx) => (
                  <div key={idx} className={`relative overflow-hidden bg-gray-50 aspect-[3/4] ${idx === 0 && images.length % 2 !== 0 ? 'col-span-2 aspect-[4/5]' : ''}`}>
                    <img
                      src={url}
                      alt={`${product.title} view ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s] ease-[0.16,1,0.3,1]"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 h-[80vh] bg-gray-50 flex items-center justify-center text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  No Archive Imagery
                </div>
              )}
            </div>

            <div className="relative lg:hidden -mx-6 px-6">
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-8">
                {images.length > 0 ? (
                  images.map((url, idx) => (
                    <div key={idx} className="snap-center min-w-[85vw] aspect-[3/4] bg-gray-50 relative">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-ink">
                        {String(idx + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-50" />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="lg:col-span-5 xl:col-span-4 order-2 lg:mt-0 relative">
            <div className="sticky top-24 space-y-10">

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-3xl lg:text-5xl font-heading font-black uppercase tracking-tighter text-ink leading-none">
                    {product.title}
                  </h1>
                  <button onClick={handleShare} className="text-gray-400 hover:text-ink transition-colors p-2 -mt-2 -mr-2" aria-label="Share Piece" title="Share Piece">
                    <ShareIcon />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xl font-medium text-ink">
                    {formatPrice(product.price)}
                  </div>
                  {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                    <>
                      <div className="text-lg font-medium text-gray-400 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1">
                        {Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)}% Savings
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                {product.description || "A curated piece blending stark minimalism with functional utility. Perfect for transitioning seasons."}
              </p>

              <div className="pt-6 border-t border-gray-100 space-y-8">
                
                {hasVariants && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-ink">Select Dimension</span>
                      <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-ink transition-colors border-b border-gray-400 hover:border-ink">Fit Guide</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((v) => {
                         const isSelected = selectedSize === v.size;
                         const isOutOfStock = v.stock === 0;
                         return (
                           <button
                             key={v.size}
                             onClick={() => !isOutOfStock && setSelectedSize(v.size)}
                             disabled={isOutOfStock}
                             className={`min-w-[3.5rem] h-12 border text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                               isSelected
                                 ? 'border-ink bg-ink text-white shadow-xl'
                                 : isOutOfStock
                                 ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                 : 'border-gray-200 bg-transparent text-ink hover:border-ink'
                             }`}
                           >
                             {v.size}
                           </button>
                         )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink">Quantity</span>
                    <div className="flex items-center border border-gray-200 h-12">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="px-4 text-ink hover:bg-gray-50 h-full flex items-center transition-colors"
                      >
                        <Minus />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{quantity}</span>
                      <button
                         onClick={() => setQuantity(q => Math.min(getStockCount() || 99, q + 1))}
                         className="px-4 text-ink hover:bg-gray-50 h-full flex items-center transition-colors"
                      >
                        <Plus />
                      </button>
                    </div>
                  </div>
                  <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 flex items-center gap-2 ${
                    inStock ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
                  }`}>
                     <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-600' : 'bg-red-500'}`} />
                     {inStock ? (getStockCount() <= 5 ? `Limited: ${getStockCount()} Remaining` : 'Available') : 'Archived'}
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!inStock}
                  className="w-full btn-primary h-14"
                >
                  {inStock ? `Acquire Piece — ${formatPrice(product.price * quantity)}` : 'Out of Stock'}
                </button>
              </div>

              {/* Minimal Accordions */}
              <div className="border-t border-b border-gray-100 divide-y divide-gray-100 mt-12">
                <AccordionItem
                  title="Design & Construction"
                  isOpen={openSection === 'details'}
                  onClick={() => toggleSection('details')}
                >
                  <ul className="space-y-2 text-sm text-gray-500 list-disc pl-4 font-medium">
                    <li>Engineered with premium transitional fabrics.</li>
                    <li>Oversized, boxy fit with dropped shoulders.</li>
                    <li>Matte finish hardware and reinforced stitching.</li>
                  </ul>
                </AccordionItem>
                <AccordionItem
                  title="Shipping & Returns"
                  isOpen={openSection === 'delivery'}
                  onClick={() => toggleSection('delivery')}
                >
                  <p className="text-sm text-gray-500 font-medium">
                    Complimentary express shipping on orders over $250. Returns are accepted within 14 days of receipt, provided the tags remain attached.
                  </p>
                </AccordionItem>
                <AccordionItem
                  title="Care Guide"
                  isOpen={openSection === 'care'}
                  onClick={() => toggleSection('care')}
                >
                  <p className="text-sm text-gray-500 font-medium">
                    Dry clean strictly recommended. To maintain structure, avoid hanging on wire hangers. Do not iron directly on fabric.
                  </p>
                </AccordionItem>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Editor's Picks */}
      {related.length > 0 && (
        <section className="container mx-auto px-6 lg:px-12 pt-32 mt-16 border-t border-gray-200">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-heading font-black uppercase tracking-tighter text-ink">Curated Archive</h2>
              <p className="text-gray-400 mt-2 text-[10px] font-bold uppercase tracking-widest">Aesthetic Companions</p>
            </div>
            <Link to="/products" className="hidden md:inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-ink border-b border-ink pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors">
              Explore Catalog
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12">
            {related.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>

          <div className="mt-16 text-center md:hidden">
             <Link to="/products" className="btn-secondary w-full">
               All Products
             </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function AccordionItem({ title, isOpen, onClick, children }) {
  return (
    <div className="py-5">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between text-left text-[11px] font-black uppercase tracking-widest text-ink hover:text-gray-500 transition-colors"
      >
        <span>{title}</span>
        <span className={`transform transition-transform duration-500 ease-[0.16,1,0.3,1] ${isOpen ? '-rotate-180' : ''}`}>
          <ChevronDown />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-[0.16,1,0.3,1] ${isOpen ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container mx-auto px-6 py-16 grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-gray-100 h-[80vh] w-full animate-pulse" />
      </div>
      <div className="lg:col-span-4 space-y-8 mt-12 lg:mt-0">
        <div className="h-12 bg-gray-100 w-3/4 animate-pulse" />
        <div className="h-8 bg-gray-100 w-1/4 animate-pulse" />
        <div className="h-24 bg-gray-100 w-full animate-pulse mt-8" />
        <div className="h-14 bg-gray-100 w-full animate-pulse mt-12" />
      </div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      <div className="border border-red-200 bg-red-50 text-red-600 px-8 py-6 text-center max-w-md">
        <p className="text-[10px] font-black uppercase tracking-widest mb-2">Error</p>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
