import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";

export default function ProductCard({ product }) {
  const { addItem, openDrawer } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const images = useMemo(
    () => (product?.productImages || []).map((img) => img.url).filter(Boolean),
    [product?.productImages]
  );

  const primaryImage = images[0] || product?.productImages?.[0]?.url;
  const secondaryImage = images[1];

  const isOut = product?.stock === 0;
  const isLowStock = product?.stock > 0 && product?.stock <= 5;
  const isNew = new Date(product?.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const added = addItem(product, 1);
    setIsAdding(false);
    if (added) openDrawer();
  };

  return (
    <div className="group relative flex flex-col">
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-slate-100 aspect-[4/5]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 bg-slate-50">No Image</div>
        )}

        {secondaryImage && (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOut && (
            <span className="inline-block bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900">
              Sold Out
            </span>
          )}
          {!isOut && isLowStock && (
            <span className="inline-block bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600">
              Low Stock
            </span>
          )}
          {!isOut && isNew && (
            <span className="inline-block bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900">
              New
            </span>
          )}
        </div>

        {!isOut && (
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 focus-within:translate-y-0">
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              aria-label={`Quick add ${product.title} to cart`}
              className="flex w-full h-11 items-center justify-center bg-white text-slate-900 font-medium text-sm hover:bg-slate-900 hover:text-white transition-colors shadow-lg disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : "Quick Add"}
            </button>
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex justify-between items-start gap-4">
          <Link
            to={`/products/${product.slug}`}
            className="text-sm font-medium text-slate-900 hover:text-slate-600 transition-colors line-clamp-1"
          >
            {product.title}
          </Link>
          <p className="text-sm font-normal text-slate-900 whitespace-nowrap">{formatPrice(product.price)}</p>
        </div>
        <p className="text-xs text-slate-500 capitalize">{product.category?.name || "Collection"}</p>
      </div>
    </div>
  );
}
