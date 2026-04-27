import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api.js";
import { formatPrice } from "../utils/format.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
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
  const navigate = useNavigate();
  const { addItem, openDrawer } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openSection, setOpenSection] = useState("details");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedBottomSize, setSelectedBottomSize] = useState("");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const productResponse = await apiGet(`/store/products/${slug}`);
        if (!active) return;
        const { related: relatedProducts, ...productData } = productResponse;
        setProduct(productData);
        setRelated(relatedProducts || []);
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

  const hasVariants = !product?.isCombo && product?.variants && product.variants.length > 0;
  const uniqueSizes = useMemo(() => Array.from(new Set(product?.variants?.map(v => v.size) || [])), [product]);
  const availableColors = useMemo(() => product?.variants?.filter(v => v.size === selectedSize) || [], [product, selectedSize]);

  const comboTopSizesList = useMemo(() => product?.comboTopSizes ? Object.keys(product.comboTopSizes) : [], [product]);
  const comboBottomSizesList = useMemo(() => product?.comboBottomSizes ? Object.keys(product.comboBottomSizes) : [], [product]);

  // When size changes, clear color or auto-select if only one
  useEffect(() => {
    if (selectedSize) {
      const colorsForSize = product.variants.filter(v => v.size === selectedSize);
      if (colorsForSize.length === 1) {
        setSelectedColor(colorsForSize[0].color);
      } else {
        setSelectedColor("");
      }
    }
  }, [selectedSize, product]);

  const activeVariant = hasVariants && selectedSize && selectedColor 
    ? product.variants.find(v => v.size === selectedSize && v.color === selectedColor) 
    : null;

  const isComboInStock = useMemo(() => {
    if (!product?.isCombo) return false;
    const topStock = Object.values(product.comboTopSizes || {}).some(s => s > 0);
    const bottomStock = Object.values(product.comboBottomSizes || {}).some(s => s > 0);
    return topStock && bottomStock;
  }, [product]);

  const inStock = product?.isCombo 
    ? isComboInStock
    : hasVariants
      ? (activeVariant 
         ? activeVariant.stock > 0 
         : product.variants.some(v => v.stock > 0))
      : (product?.stock === undefined || product?.stock > 0);

  const getStockCount = () => {
    if (product?.isCombo) {
      if (selectedSize && selectedBottomSize) {
        return Math.min(
          product.comboTopSizes[selectedSize] || 0,
          product.comboBottomSizes[selectedBottomSize] || 0
        );
      }
      return 1; 
    }
    if (hasVariants) {
      if (activeVariant) return activeVariant.stock;
      return product.variants.reduce((acc, v) => acc + v.stock, 0);
    }
    return product?.stock || 0;
  };

  const handleAdd = () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/products/${product.slug}`);
      return;
    }
    if (product.isCombo) {
      if (!selectedSize) {
        alert("Please select a Top/Shirt size.");
        return;
      }
      if (!selectedBottomSize) {
        alert("Please select a Bottom/Pant size.");
        return;
      }
      const combinedSize = `${selectedSize} Top | ${selectedBottomSize} Bottom`;
      const success = addItem(product, Number(quantity) || 1, combinedSize, "Default");
      if (success) openDrawer();
      return;
    }

    if (hasVariants) {
      if (!selectedSize) {
        alert("Please select a size.");
        return;
      }
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

            {/* DESCRIPTION ON LEFT SIDE (DESKTOP) */}
            <div className="hidden lg:block mt-8 lg:mt-16 max-w-2xl pr-4 lg:pr-12">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink mb-4">Designer's Notes</h3>
              <div className="text-sm text-gray-500 leading-relaxed transition-all duration-300">
                {isDescExpanded ? (
                  <p className="whitespace-pre-wrap">{product.description || "A curated piece blending stark minimalism with functional utility."}</p>
                ) : (
                  <p className="line-clamp-3 whitespace-pre-wrap">
                    {product.description || "A curated piece blending stark minimalism with functional utility."}
                  </p>
                )}
                <button 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-6 text-[10px] font-bold uppercase tracking-widest text-ink hover:text-gray-400 border-b border-ink pb-0.5 transition-colors"
                >
                  {isDescExpanded ? 'Read Less' : 'Read More'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="lg:col-span-5 xl:col-span-4 order-2 lg:mt-0 relative">
            <div className="sticky top-24 space-y-10">

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h1 className="text-3xl lg:text-5xl font-heading font-black uppercase tracking-tighter text-ink leading-none">
                      {product.title}
                    </h1>
                    {product.instagramLink && (
                      <a href={product.instagramLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" title="View on Instagram" aria-label="View on Instagram">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                  </div>
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

              {product.availableColors && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-ink">Color Variants</span>
                  <div className="inline-flex border border-gray-200 bg-white shadow-sm">
                    {product.availableColors.split(",").map((c, i) => (
                      <div key={i} className={`px-6 h-10 text-ink text-[10px] font-black uppercase tracking-widest flex items-center justify-center ${i !== 0 ? 'border-l border-gray-200' : ''}`}>
                        {c.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Siblings — linked product swatches */}
              {product.colorGroup && (product.colorSiblings?.length > 0 || product.colorLabel) && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-ink">Available Colors</span>
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Current product — active state */}
                    {product.colorLabel && (
                      <div className="px-5 h-10 border-2 border-ink bg-ink text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                        {product.productImages?.[0]?.url && (
                          <img src={product.productImages[0].url} alt="" className="w-5 h-5 object-cover rounded-sm" />
                        )}
                        {product.colorLabel}
                      </div>
                    )}
                    {/* Sibling products — navigate on click */}
                    {(product.colorSiblings || []).map((sibling) => (
                      <Link
                        key={sibling.id}
                        to={`/products/${sibling.slug}`}
                        className="px-5 h-10 border border-gray-200 bg-transparent text-ink text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:border-ink transition-all duration-200"
                      >
                        {sibling.productImages?.[0]?.url && (
                          <img src={sibling.productImages[0].url} alt="" className="w-5 h-5 object-cover rounded-sm" />
                        )}
                        {sibling.colorLabel || 'Variant'}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 space-y-8">
                
                {product.isCombo && (
                  <div className="space-y-12 lg:space-y-14 py-4">
                    {/* Top Size */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-[9px] font-black">1</span>
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-ink">Select Top Dimension</span>
                        </div>
                        <button className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-ink transition-colors pb-0.5 border-b border-transparent hover:border-ink">Fit Guide</button>
                      </div>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {comboTopSizesList.map((size) => {
                           const isSelected = selectedSize === size;
                           const isOutOfStock = (product.comboTopSizes[size] || 0) === 0;
                           return (
                             <button
                               key={`top-${size}`}
                               onClick={() => !isOutOfStock && setSelectedSize(size)}
                               disabled={isOutOfStock}
                               className={`min-w-[4rem] sm:min-w-[4.5rem] px-4 h-14 border text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                                 isSelected
                                   ? 'border-ink bg-ink text-white shadow-xl scale-105'
                                   : isOutOfStock
                                   ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                   : 'border-gray-200 bg-transparent text-ink hover:border-ink hover:-translate-y-0.5'
                               }`}
                             >
                               {size}
                             </button>
                           )
                        })}
                      </div>
                    </div>
                    
                    {/* Bottom Size */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-[9px] font-black">2</span>
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-ink">Select Bottom Dimension</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {comboBottomSizesList.map((size) => {
                           const isSelected = selectedBottomSize === size;
                           const isOutOfStock = (product.comboBottomSizes[size] || 0) === 0;
                           return (
                             <button
                               key={`bottom-${size}`}
                               onClick={() => !isOutOfStock && setSelectedBottomSize(size)}
                               disabled={isOutOfStock}
                               className={`min-w-[4rem] sm:min-w-[4.5rem] px-4 h-14 border text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                                 isSelected
                                   ? 'border-ink bg-ink text-white shadow-xl scale-105'
                                   : isOutOfStock
                                   ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                   : 'border-gray-200 bg-transparent text-ink hover:border-ink hover:-translate-y-0.5'
                               }`}
                             >
                               {size}
                             </button>
                           )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {hasVariants && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-ink">Select Dimension</span>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-ink transition-colors border-b border-gray-400 hover:border-ink">Fit Guide</button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {uniqueSizes.map((size) => {
                           const isSelected = selectedSize === size;
                           const isAvailableAnywhere = product.variants.some(v => v.size === size && v.stock > 0);
                           return (
                             <button
                               key={size}
                               onClick={() => isAvailableAnywhere && setSelectedSize(size)}
                               disabled={!isAvailableAnywhere}
                               className={`min-w-[3.5rem] px-4 h-12 border text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                                 isSelected
                                   ? 'border-ink bg-ink text-white shadow-xl'
                                   : !isAvailableAnywhere
                                   ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                   : 'border-gray-200 bg-transparent text-ink hover:border-ink'
                               }`}
                             >
                               {size}
                             </button>
                           )
                        })}
                      </div>
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
                    inStock && getStockCount() > 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
                  }`}>
                     <span className={`w-1.5 h-1.5 rounded-full ${inStock && getStockCount() > 0 ? 'bg-green-600' : 'bg-red-500'}`} />
                     {inStock && getStockCount() > 0 ? (getStockCount() <= 5 ? `Limited: ${getStockCount()} Remaining` : 'Available') : 'Out of Stock'}
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

              {/* DESCRIPTION ON RIGHT SIDE (MOBILE ONLY) */}
              <div className="block lg:hidden mt-10 pt-8 border-t border-gray-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink mb-4">Designer's Notes</h3>
                <div className="text-sm text-gray-500 leading-relaxed transition-all duration-300">
                  {isDescExpanded ? (
                    <p className="whitespace-pre-wrap">{product.description || "A curated piece blending stark minimalism with functional utility."}</p>
                  ) : (
                    <p className="line-clamp-3 whitespace-pre-wrap">
                      {product.description || "A curated piece blending stark minimalism with functional utility."}
                    </p>
                  )}
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="mt-6 text-[10px] font-bold uppercase tracking-widest text-ink hover:text-gray-400 border-b border-ink pb-0.5 transition-colors"
                  >
                    {isDescExpanded ? 'Read Less' : 'Read More'}
                  </button>
                </div>
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
