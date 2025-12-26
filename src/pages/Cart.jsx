import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import { apiGet } from "../utils/api.js";

export default function Cart() {
  const { items, updateQuantity, removeItem, clear, subtotal, shippingFee, total, updateItemStock } = useCart();

  const itemIds = useMemo(() => items.map((i) => i.id).sort().join(","), [items]);
  const FREE_SHIP = 2500;
  const freeShipRemaining = Math.max(FREE_SHIP - subtotal, 0);
  const freeShipProgress = Math.min((subtotal / FREE_SHIP) * 100, 100);

  useEffect(() => {
    if (!itemIds) return;
    let active = true;
    const idsParam = itemIds;

    const refreshStocks = async () => {
      try {
        const data = await apiGet(`/store/products?ids=${idsParam}`);
        if (!active) return;
        (data?.products || []).forEach((product) => {
          if (product?.id !== undefined) {
            updateItemStock(product.id, product.stock);
          }
        });
      } catch (err) {
        console.error("Failed to refresh stocks", err);
      }
    };

    refreshStocks();
    return () => {
      active = false;
    };
  }, [itemIds, updateItemStock]);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-inner">
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <p className="text-slate-600">Start with the latest drops and seasonal edits.</p>
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg" to="/products">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-12">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">Review your bag</h1>
            <p className="text-sm text-slate-600">Edit items, check delivery fees, and head to checkout.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/products"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5"
            >
              Continue shopping
            </Link>
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
              onClick={clear}
            >
              Clear bag
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {[{ label: "Bag", active: true }, { label: "Delivery" }, { label: "Payment" }].map((step, idx) => (
            <React.Fragment key={step.label}>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                  step.active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {idx + 1}
              </span>
              <span className={step.active ? "text-slate-900" : "text-slate-500"}>{step.label}</span>
              {idx < 2 && <span className="mx-2 h-px w-8 bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Items</span>
              <span>{items.length} {items.length === 1 ? "item" : "items"}</span>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:grid-cols-[110px_1fr_auto]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No image</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Link to={`/products/${item.slug}`} className="font-semibold text-slate-900 hover:underline">
                        {item.title}
                      </Link>
                      <p className="text-sm font-semibold text-slate-900">{formatPrice(item.price)}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                          In stock
                        </span>
                        <span className="hidden sm:inline">Delivery fee applied at checkout</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:justify-center">
                    {item.stock === 0 ? (
                      <span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
                        Out of stock
                      </span>
                    ) : (
                      <label className="text-xs font-semibold text-slate-600">
                        Qty
                        <select
                          value={item.quantity || 1}
                          onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                          className="mt-1 w-full max-w-[120px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                        >
                          {Array.from(
                            { length: Math.min(10, item.stock !== undefined ? item.stock : 10) },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                          {(item.quantity || 1) > Math.min(10, item.stock !== undefined ? item.stock : 10) && (
                            <option value={item.quantity || 1}>{item.quantity}</option>
                          )}
                        </select>
                      </label>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                      <button className="hover:text-slate-900" onClick={() => removeItem(item.id)}>
                        Remove
                      </button>
                      <span aria-hidden>•</span>
                      <button className="hover:text-slate-900" type="button">
                        Save for later
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-1 text-right">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Line total</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatPrice(Number(item.price || 0) * (item.quantity || 1))}
                    </p>
                    <p className="text-xs text-slate-500">Inclusive of taxes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside id="checkout-summary" className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                {freeShipRemaining === 0 ? "Free delivery unlocked" : "Free delivery progress"}
              </span>
              <span className="text-xs text-slate-600">
                {freeShipRemaining === 0 ? "₹0 left" : `${formatPrice(freeShipRemaining)} to go`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${freeShipProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-600">Delivery fee waives at ₹{FREE_SHIP}. Keep shopping to save on shipping.</p>
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery fee</span>
              <span className="font-semibold text-slate-900">{formatPrice(shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-600">
            Need to edit your address? Update it in your <Link to="/profile" className="font-semibold text-slate-900 underline">profile</Link> so it pre-fills at checkout.
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            to="/checkout"
          >
            Proceed to checkout
          </Link>
          <p className="text-sm text-slate-600">
            Orders are created before payment and marked paid once Razorpay confirms.
          </p>
        </aside>
      </div>
    </div>
  );
}
