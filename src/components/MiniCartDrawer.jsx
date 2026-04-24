import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";

export default function MiniCartDrawer() {
  const { items, subtotal, shippingFee, total, drawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();
  const FREE_SHIP = 2500;
  const freeShipRemaining = Math.max(FREE_SHIP - subtotal, 0);
  const freeShipProgress = Math.min((subtotal / FREE_SHIP) * 100, 100);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={closeDrawer}
      aria-modal="true"
      role="dialog"
    >
      <aside
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-500 ease-[0.16,1,0.3,1]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Your Bag</p>
            <p className="text-xl font-heading font-bold text-ink tracking-tight">
              {items.length ? `${items.length} Item${items.length > 1 ? "s" : ""}` : "Empty"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 text-gray-400 hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X strokeWidth={1.5} size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-200" strokeWidth={1} />
              <div className="space-y-2">
                <p className="text-lg font-heading font-bold text-ink">Your bag is empty</p>
                <p className="text-sm text-gray-500">Discover our latest arrivals.</p>
              </div>
              <Link
                to="/products"
                onClick={closeDrawer}
                className="btn-primary mt-4"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-4">
                  <div className="h-28 w-24 flex-shrink-0 bg-gray-50 aspect-[3/4]">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-widest text-gray-400">No Img</div>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          to={`/products/${item.slug}`}
                          className="text-xs font-bold uppercase tracking-widest text-ink hover:text-gray-500 line-clamp-2"
                          onClick={closeDrawer}
                        >
                          {item.title}
                        </Link>
                        <p className="text-sm font-medium text-ink whitespace-nowrap">{formatPrice(item.price)}</p>
                      </div>
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 flex flex-wrap gap-2">
                        {item.size && <span>{item.size}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Control */}
                      <div className="flex items-center border border-gray-200">
                        <button
                          className="px-3 py-1 text-ink hover:bg-gray-50 transition-colors"
                          onClick={() => updateQuantity(item.cartItemId, Math.max(1, (item.quantity || 1) - 1))}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity || 1}</span>
                        <button
                          className="px-3 py-1 text-ink hover:bg-gray-50 transition-colors"
                          onClick={() => updateQuantity(item.cartItemId, (item.quantity || 1) + 1)}
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-white px-6 py-6">
            <div className="space-y-4 mb-6">
              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-ink font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-ink font-medium">{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-ink border-t border-gray-100 pt-3 mt-3">
                  <span className="font-bold uppercase tracking-widest text-xs">Total</span>
                  <span className="font-bold text-lg">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/checkout"
                onClick={closeDrawer}
                className="btn-primary w-full block text-center"
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="btn-secondary w-full block text-center"
              >
                View Bag
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
