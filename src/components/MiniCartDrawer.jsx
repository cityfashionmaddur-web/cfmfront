import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
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
      className="fixed inset-0 z-50 hidden items-end bg-black/50 backdrop-blur-sm md:flex md:items-start md:justify-end"
      onClick={closeDrawer}
      aria-modal="true"
      role="dialog"
    >
      <aside
        className="relative flex h-[80vh] w-full max-w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-transform duration-200 md:max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="absolute left-1/2 top-2 block h-1.5 w-16 -translate-x-1/2 rounded-full bg-slate-200 md:hidden" aria-hidden />
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Mini bag</p>
            <p className="text-xl font-semibold text-slate-900">
              {items.length ? `${items.length} item${items.length > 1 ? "s" : ""}` : "Your cart is empty"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            aria-label="Close mini cart"
          >
            Close
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4 px-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <ShoppingBag className="h-8 w-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Looks like you haven't added anything to your cart yet.
                </p>
              </div>
              <Link
                to="/products"
                onClick={closeDrawer}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:grid-cols-[auto_1fr_auto]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No image</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Link
                        to={`/products/${item.slug}`}
                        className="line-clamp-2 font-semibold text-slate-900 hover:underline"
                        onClick={closeDrawer}
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm font-semibold text-slate-900">{formatPrice(item.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-center">
                    <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 shadow-sm">
                      <button
                        className="px-3 py-1.5 text-sm text-slate-500 transition hover:text-slate-900"
                        onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                        aria-label={`Decrease quantity of ${item.title}`}
                      >
                        −
                      </button>
                      <span className="px-3 text-sm font-semibold text-slate-900">{item.quantity || 1}</span>
                      <button
                        className="px-3 py-1.5 text-sm text-slate-500 transition hover:text-slate-900"
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-1 text-right">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Line total</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPrice(Number(item.price || 0) * (item.quantity || 1))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="space-y-2 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold text-slate-900">
                {freeShipRemaining === 0 ? "Free delivery unlocked" : "Free delivery progress"}
              </span>
              <span className="text-[11px] text-slate-600">
                {freeShipRemaining === 0 ? "₹0 left" : `${formatPrice(freeShipRemaining)} to go`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${freeShipProgress}%` }}
              />
            </div>
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="text-base font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery fee</span>
              <span className="text-base font-semibold text-slate-900">{formatPrice(shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 font-semibold">
              <span>Total</span>
              <span className="text-base">{formatPrice(total)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">
              🔒 Secure payment (Razorpay)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">
              Taxes included
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/checkout"
              onClick={closeDrawer}
              className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Checkout now
            </Link>
            <Link
              to="/cart"
              onClick={closeDrawer}
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              View cart
            </Link>
          </div>
          <button
            onClick={closeDrawer}
            className="w-full rounded-full border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            Keep browsing
          </button>
        </div>
      </aside>
    </div>
  );
}
