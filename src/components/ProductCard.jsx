import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format.js";

export default function ProductCard({ product }) {
  const images = useMemo(
    () => (product?.productImages || []).map((img) => img.url).filter(Boolean),
    [product?.productImages]
  );

  const primaryImage = images[0] || product?.productImages?.[0]?.url;
  const secondaryImage = images[1];

  const isOut = product?.stock === 0;
  const isLowStock = product?.stock > 0 && product?.stock <= 5;
  const isNew = new Date(product?.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const hasSale = product?.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  const discountPercent = hasSale 
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100) 
    : 0;

  return (
    <div className="group relative flex flex-col">
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-gray-50 aspect-[3/4]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-1000 ease-[0.25,1,0.5,1] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 bg-gray-50 font-medium text-xs tracking-widest uppercase">No Image</div>
        )}

        {secondaryImage && (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-[0.25,1,0.5,1] group-hover:opacity-100"
          />
        )}

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasSale && !isOut && (
            <span className="inline-block bg-red-600 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {isOut && (
            <span className="inline-block bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-ink shadow-sm">
              Sold Out
            </span>
          )}
          {!isOut && isLowStock && (
            <span className="inline-block bg-ink px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-sm">
              Few Left
            </span>
          )}
          {!isOut && !hasSale && isNew && (
            <span className="inline-block bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-ink shadow-sm">
              New Output
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4 flex flex-col gap-1 items-center text-center px-2">
        <Link
          to={`/products/${product.slug}`}
          className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink hover:text-gray-500 transition-colors line-clamp-1"
        >
          {product.title}
        </Link>
        <p className="text-xs font-medium text-gray-500 mt-1 flex items-center justify-center gap-2">
          {hasSale && (
            <span className="line-through text-gray-300">{formatPrice(product.compareAtPrice)}</span>
          )}
          <span className={hasSale ? "text-red-600 font-bold" : "text-ink"}>{formatPrice(product.price)}</span>
        </p>
      </div>
    </div>
  );
}
