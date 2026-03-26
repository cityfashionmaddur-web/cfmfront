import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiPost } from "../utils/api.js";
import { formatPrice } from "../utils/format.js";

const emptyForm = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: ""
};

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

function FloatingInput({ label, value, onChange, type = "text", required = false }) {
  const [focused, setFocused] = useState(false);
  const active = focused || String(value).length > 0;
  
  return (
    <div className="relative w-full pt-4">
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full border-b border-gray-300 bg-transparent pt-4 pb-2 text-sm font-medium text-ink outline-none transition-colors focus:border-ink rounded-none"
      />
      <label
        className={`pointer-events-none absolute left-0 transition-all duration-300 ease-[0.16,1,0.3,1] ${
          active 
            ? "top-0 text-[10px] font-black uppercase tracking-widest text-ink" 
            : "top-8 text-sm font-medium text-gray-400"
        }`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}

export default function Checkout() {
  const { items, subtotal, shippingFee, total, clear } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [formState, setFormState] = useState(emptyForm);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const updateField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const hasSavedAddress =
    user &&
    [
      user.addressLine1,
      user.city,
      user.state,
      user.postalCode,
      user.country,
      user.phone
    ].some(Boolean);

  const applySavedAddress = () => {
    if (!user) return;
    setFormState({
      addressLine1: user.addressLine1 || "",
      addressLine2: user.addressLine2 || "",
      city: user.city || "",
      state: user.state || "",
      postalCode: user.postalCode || "",
      country: user.country || "",
      phone: user.phone || ""
    });
  };

  useEffect(() => {
    if (!hasSavedAddress) return;
    setFormState((prev) => {
      const alreadyFilled = Object.values(prev).some(Boolean);
      if (alreadyFilled) return prev;
      return {
        ...prev,
        addressLine1: user.addressLine1 || "",
        addressLine2: user.addressLine2 || "",
        city: user.city || "",
        state: user.state || "",
        postalCode: user.postalCode || "",
        country: user.country || "",
        phone: user.phone || ""
      };
    });
  }, [hasSavedAddress, user]);

  const launchRazorpay = async (orderPayload) => {
    const { order, keyId, localOrderId } = orderPayload;

    const cancelOrder = async (message) => {
      try {
        await apiPost(`/orders/${localOrderId}/cancel`, {}, { auth: true });
      } catch (err) {
        console.warn("Failed to cancel pending order", err?.message);
      } finally {
        setStatus({
          loading: false,
          error: message || "Payment unfulfilled. Order terminated.",
          success: ""
        });
      }
    };

    const rzp = new window.Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: "CITYFASHION MADDUR",
      description: "Secure Checkout",
      order_id: order.id,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: formState.phone || ""
      },
      notes: {
        cart_items: String(items.length || 0)
      },
      handler: async (response) => {
        try {
          clear();
          setStatus({
            loading: false,
            error: "",
            success: `Order #${localOrderId} successfully secured. Awaiting fulfillment.`
          });
          window.scrollTo(0, 0);
        } catch (err) {
          setStatus({
            loading: false,
            error: err.message || "Payment captured. Order will sync once we receive Razorpay confirmation.",
            success: ""
          });
        }
      },
      modal: {
        ondismiss: () => cancelOrder("Checkout sequence closed. Order terminated.")
      },
      theme: { color: "#000000" }
    });

    rzp.on("payment.failed", () => cancelOrder("Secure payment failed. Order terminated."));
    rzp.open();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!items.length) return;
    if (total <= 0) {
      setStatus({ loading: false, error: "Cart minimum not met.", success: "" });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });

    try {
      await loadRazorpay();

      const orderPayload = await apiPost(
        "/payments/razorpay/order",
        {
          currency: "INR",
          receipt: `cf-${Date.now()}`,
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity, size: item.size })),
          ...formState
        },
        { auth: true }
      );

      await launchRazorpay(orderPayload);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message || "Failed to initialize secure checkout. Please try again.",
        success: ""
      });
    }
  };

  if (!items.length && !status.success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-3xl font-heading font-black uppercase tracking-tighter text-ink mb-4">Cart Empty</h2>
        <p className="text-sm text-gray-500 font-medium mb-8">Your cart contains no items. Add archive pieces before checkout.</p>
        <Link to="/products" className="btn-primary">Return to Catalog</Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-3xl font-heading font-black uppercase tracking-tighter text-ink mb-4">Authentication Required</h2>
        <p className="text-sm text-gray-500 font-medium mb-8">Secure checkout requires a verified profile.</p>
        <Link to="/login?returnTo=/checkout" className="btn-primary">Proceed to Login</Link>
      </div>
    );
  }

  if (status.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 pb-32">
        <div className="w-full max-w-lg bg-white p-12 border border-gray-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-ink text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Cityfashion Maddur</h1>
          <h2 className="text-4xl font-heading font-black uppercase tracking-tighter text-ink mb-6">Payment Cleared</h2>
          <p className="text-sm font-medium text-gray-600 mb-10 leading-relaxed border-t border-b border-gray-100 py-6">{status.success}</p>
          <Link to="/orders" className="btn-primary w-full block h-14 leading-[56px]">View Output Timeline</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white text-ink">
      
      {/* LEFT: Identity & Forms */}
      <div className="flex-1 px-6 pt-16 pb-24 lg:px-16 xl:px-24 xl:pt-24 flex flex-col justify-between">
        <div className="max-w-xl mx-auto w-full">
          <header className="mb-16">
            <Link to="/" className="text-[11px] font-black uppercase tracking-[0.3em] text-ink hover:text-gray-500 transition-colors mb-2 inline-block">
              Cityfashion Maddur
            </Link>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-heading font-black uppercase tracking-tighter text-ink leading-none">
              Checkout
            </h1>
            
            <div className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <Link to="/cart" className="hover:text-ink transition-colors">Bag</Link>
              <span>/</span>
              <span className="text-ink">Logistics</span>
              <span>/</span>
              <span>Payment</span>
            </div>
          </header>

          <section>
            <div className="flex items-end justify-between mb-8 pb-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-ink">Shipping Logistics</h2>
              {hasSavedAddress && (
                <button
                  type="button"
                  onClick={applySavedAddress}
                  className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-ink transition-colors border-b border-gray-300 pb-1"
                >
                  Apply Saved Profile
                </button>
              )}
            </div>

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FloatingInput
                    label="Address Line 1"
                    required
                    value={formState.addressLine1}
                    onChange={(v) => updateField('addressLine1', v)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FloatingInput
                    label="Address Line 2 (Optional)"
                    value={formState.addressLine2}
                    onChange={(v) => updateField('addressLine2', v)}
                  />
                </div>
                <FloatingInput
                  label="City"
                  required
                  value={formState.city}
                  onChange={(v) => updateField('city', v)}
                />
                <FloatingInput
                  label="State / Province"
                  required
                  value={formState.state}
                  onChange={(v) => updateField('state', v)}
                />
                <FloatingInput
                  label="Postal Code"
                  required
                  value={formState.postalCode}
                  onChange={(v) => updateField('postalCode', v)}
                />
                <FloatingInput
                  label="Country"
                  required
                  value={formState.country}
                  onChange={(v) => updateField('country', v)}
                />
                <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-100">
                  <FloatingInput
                    label="Contact Phone"
                    type="tel"
                    required
                    value={formState.phone}
                    onChange={(v) => updateField('phone', v)}
                  />
                </div>
              </div>
            </form>
          </section>

          {status.error && (
            <div className="mt-8 border border-red-200 bg-red-50 py-4 px-6 text-red-600 text-sm font-medium">
              <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Notice</span>
              {status.error}
            </div>
          )}
        </div>
        
        <footer className="max-w-xl mx-auto w-full pt-16 border-t border-gray-100 mt-16 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400">
          <span>© {new Date().getFullYear()} Cityfashion Maddur</span>
          <span>Secure Checkout</span>
        </footer>
      </div>

      {/* RIGHT: Order Ledger Summary */}
      <div className="w-full lg:w-[45%] xl:w-[40%] bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 px-6 pt-16 pb-24 lg:px-12 xl:px-16 lg:sticky lg:top-0 h-full lg:min-h-screen">
        <div className="max-w-md mx-auto">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-ink mb-8 border-b border-gray-200 pb-4">
            Order Ledger
          </h2>

          <div className="flex flex-col gap-6 max-h-[40vh] lg:max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 group">
                <div className="h-24 w-16 xl:h-28 xl:w-20 flex-shrink-0 bg-white border border-gray-200 overflow-hidden relative">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-110" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-[8px] font-black tracking-widest text-gray-300 uppercase">Blank</div>
                  )}
                  <div className="absolute top-0 right-0 bg-ink text-white w-5 h-5 flex items-center justify-center text-[9px] font-bold">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center py-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink pr-2">{item.title}</h3>
                      {item.size && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Dimension: {item.size}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-ink whitespace-nowrap">{formatPrice(Number(item.price) * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 mt-8 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-500">
              <span>Logistics</span>
              <span>{shippingFee === 0 ? "Complimentary" : formatPrice(shippingFee)}</span>
            </div>
            
            <div className="flex justify-between items-end pt-6 mt-6 border-t border-ink">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-ink">Total Settlement</span>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mr-2">INR</span>
                <span className="text-3xl font-black">{formatPrice(total).replace('₹', '')}</span>
              </div>
            </div>
          </div>

          <div className="pt-10">
            <button
              type="submit"
              form="checkout-form"
              disabled={status.loading}
              className={`w-full h-14 bg-ink text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ease-[0.16,1,0.3,1] ${
                status.loading ? "opacity-70 scale-[0.98]" : "hover:bg-gray-800 hover:shadow-2xl hover:-translate-y-1"
              }`}
            >
              {status.loading ? "Processing Authorization..." : "Authorize Payment"}
            </button>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center mt-6 leading-relaxed flex items-center justify-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Transactions are securely encrypted
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
