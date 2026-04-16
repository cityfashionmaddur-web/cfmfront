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
             items.filter(i => i.id === product.id).forEach(cartItem => {
               let stock = 0;
               if (product.isCombo && cartItem.size) {
                 const [topPart, bottomPart] = cartItem.size.split(' | ');
                 if (topPart && bottomPart) {
                   const topSize = topPart.replace(' Top', '').trim();
                   const bottomSize = bottomPart.replace(' Bottom', '').trim();
                   const topStock = (product.comboTopSizes && product.comboTopSizes[topSize]) || 0;
                   const bottomStock = (product.comboBottomSizes && product.comboBottomSizes[bottomSize]) || 0;
                   stock = Math.min(topStock, bottomStock);
                 }
               } else if (product.variants?.length > 0) {
                 const variant = product.variants.find(v => v.size === cartItem.size && v.color === cartItem.color);
                 stock = variant ? variant.stock : 0;
               } else {
                 stock = product.stock || 0;
               }
               updateItemStock(cartItem.cartItemId, stock);
            });
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
      <div className="container mx-auto px-6 py-32 flex flex-col items-center justify-center text-center">
        <div className="border border-gray-200 bg-gray-50/50 p-12 max-w-lg w-full">
          <h2 className="text-3xl font-heading font-black uppercase tracking-tighter text-ink mb-2">Cart is Empty</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8 mt-4">Curate your look.</p>
          <Link className="btn-primary" to="/products">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24 space-y-12">
      <div className="border-b border-gray-200 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-heading font-black uppercase tracking-tighter text-ink">Your Selection</h1>
            <p className="text-gray-400 mt-2 text-[10px] font-bold uppercase tracking-widest">
              Review items before securing checkout.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/products"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-1"
            >
              Continue Shopping
            </Link>
            <button
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-red-500 transition-colors border-b border-transparent hover:border-red-500 pb-1"
              onClick={clear}
            >
              Clear Bag
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-ink border-b border-gray-200 pb-4">
            <span>Items ({items.length})</span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="py-6 grid gap-6 sm:grid-cols-[120px_1fr_auto]"
              >
                <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest font-bold text-gray-400">No Image</div>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <Link to={`/products/${item.slug}`} className="text-lg font-heading font-black uppercase tracking-tight text-ink hover:underline underline-offset-4">
                    {item.title}
                  </Link>
                  <p className="text-sm font-medium text-ink mt-1">{formatPrice(item.price)}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-6">
                    {item.size && (
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border border-gray-200 px-3 py-1">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && item.color !== 'Default' && item.color !== '' && (
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border border-gray-200 px-3 py-1">
                        Color: {item.color}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-6 flex flex-wrap gap-4 items-center">
                    {item.stock === 0 ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                        Out of stock
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</label>
                        <div className="border border-gray-200 px-2 py-1">
                          <select
                            value={item.quantity || 1}
                            onChange={(event) => updateQuantity(item.cartItemId, Number(event.target.value))}
                            className="text-xs font-bold bg-transparent text-ink focus:outline-none appearance-none pr-4"
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
                        </div>
                      </div>
                    )}
                    <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-ink underline underline-offset-4" onClick={() => removeItem(item.cartItemId)}>
                      Remove
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end sm:justify-center">
                  <p className="text-lg font-bold text-ink">
                    {formatPrice(Number(item.price || 0) * (item.quantity || 1))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24">
          <div className="border border-gray-200 p-8 space-y-6 bg-gray-50/30">
            <h2 className="text-xl font-heading font-black tracking-tighter uppercase text-ink border-b border-gray-200 pb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>
                    {freeShipRemaining === 0 ? "Free Delivery Unlocked" : "Free Delivery Progress"}
                  </span>
                  <span>
                    {freeShipRemaining === 0 ? "₹0 Left" : `${formatPrice(freeShipRemaining)} To Go`}
                  </span>
                </div>
                <div className="h-1 bg-gray-200">
                  <div
                    className="h-full bg-ink transition-all duration-500"
                    style={{ width: `${freeShipProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 text-sm font-medium text-ink">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span>{shippingFee === 0 ? "Complimentary" : formatPrice(shippingFee)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-ink flex items-center justify-between text-xl font-medium text-ink mt-6">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Link
              className="btn-primary w-full text-center py-4 mt-8 block"
              to="/checkout"
            >
              Secure Checkout
            </Link>

            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center leading-relaxed">
              Taxes included. Complete address details in your <Link to="/profile" className="text-ink underline">profile</Link> to expedite checkout.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
