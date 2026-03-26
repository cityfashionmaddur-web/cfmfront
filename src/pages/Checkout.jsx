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

function InputField({ label, placeholder, value, onChange, required = false, type = "text" }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-black uppercase tracking-widest text-ink mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        className="w-full border-b border-gray-300 bg-transparent py-3 text-sm font-medium text-ink placeholder-gray-400 focus:outline-none focus:border-ink transition-colors rounded-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
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
    // Prefill once when user has a saved address and the form is empty
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
      theme: {
        color: "#000000"
      }
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
        error: err.message || "Failed to initialize secure checkout.",
        success: ""
      });
    }
  };

  if (!items.length && !status.success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-heading font-black uppercase tracking-tighter text-ink mb-4">Cart Empty</h2>
        <p className="text-sm text-gray-500 font-medium mb-8">Your cart contains no items. Add archive pieces before checkout.</p>
        <Link to="/products" className="btn-primary">Return to Catalog</Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-heading font-black uppercase tracking-tighter text-ink mb-4">Authentication Required</h2>
        <p className="text-sm text-gray-500 font-medium mb-8">Secure checkout requires a verified profile.</p>
        <Link to="/login?returnTo=/checkout" className="btn-primary">Proceed to Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-ink pt-20 pb-32">
      <div className="container mx-auto px-6 lg:px-12">
        <header className="mb-12 border-b border-gray-200 pb-8 text-center lg:text-left">
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-ink transition-colors mb-4 inline-block">
            Cityfashion Maddur
          </Link>
          <h1 className="text-4xl lg:text-5xl font-heading font-black uppercase tracking-tighter text-ink">
            Secure Checkout
          </h1>
        </header>

        {status.success ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-ink text-white rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-3xl font-heading font-black uppercase tracking-tighter text-ink mb-4">Payment Cleared</h2>
            <p className="text-sm font-medium text-gray-600 max-w-md mx-auto mb-8">{status.success}</p>
            <Link to="/orders" className="btn-primary">View Output Timeline</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 xl:gap-24">
            
            {/* LEFT: Forms */}
            <div className="space-y-12">
              <section>
                <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-black uppercase tracking-widest text-ink">Shipping Logistics</h2>
                  {hasSavedAddress && (
                    <button
                      type="button"
                      onClick={applySavedAddress}
                      className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-ink hover:underline decoration-ink underline-offset-4 transition-all"
                    >
                      Apply Saved Domain
                    </button>
                  )}
                </div>

                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <InputField
                        label="Address Line 1"
                        placeholder="Street address or P.O. Box"
                        value={formState.addressLine1}
                        onChange={(v) => updateField('addressLine1', v)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <InputField
                        label="Address Line 2"
                        placeholder="Apartment, suite, unit, etc. (optional)"
                        value={formState.addressLine2}
                        onChange={(v) => updateField('addressLine2', v)}
                      />
                    </div>
                    <InputField
                      label="City"
                      placeholder="City text block"
                      value={formState.city}
                      onChange={(v) => updateField('city', v)}
                      required
                    />
                    <InputField
                      label="State / Province"
                      placeholder="State region"
                      value={formState.state}
                      onChange={(v) => updateField('state', v)}
                      required
                    />
                    <InputField
                      label="Postal Code"
                      placeholder="ZIP or Postal routing code"
                      value={formState.postalCode}
                      onChange={(v) => updateField('postalCode', v)}
                      required
                    />
                    <InputField
                      label="Country"
                      placeholder="Country domain"
                      value={formState.country}
                      onChange={(v) => updateField('country', v)}
                      required
                    />
                    <div className="sm:col-span-2 mt-4 pt-6 border-t border-gray-100">
                      <InputField
                        label="Contact Phone"
                        placeholder="Phone number for delivery updates"
                        type="tel"
                        value={formState.phone}
                        onChange={(v) => updateField('phone', v)}
                        required
                      />
                    </div>
                  </div>
                </form>
              </section>

              {status.error && (
                <div className="border border-red-200 bg-red-50 py-4 px-6 text-red-600 text-sm font-medium">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Notice</span>
                  {status.error}
                </div>
              )}

            </div>

            {/* RIGHT: Order Summary */}
            <div className="lg:pl-12 lg:border-l border-gray-200">
              <div className="sticky top-24 space-y-8">
                <h2 className="text-lg font-black uppercase tracking-widest text-ink border-b border-gray-200 pb-4">
                  Order Ledger
                </h2>

                <div className="flex flex-col gap-6">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-4 group">
                      <div className="h-24 w-16 flex-shrink-0 bg-gray-50 border border-gray-100 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[8px] font-black tracking-widest text-gray-300 uppercase"><span>No</span><span>Img</span></div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-ink line-clamp-2 pr-4">{item.title}</h3>
                          {item.size && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Size: {item.size}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-sm font-bold text-ink">{formatPrice(Number(item.price) * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Expedited Logistics</span>
                    <span>{shippingFee === 0 ? "Complimentary" : formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-ink">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink">Total Settlement</span>
                    <span className="text-2xl font-black">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="pt-8 block">
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={status.loading}
                    className="btn-primary w-full h-14"
                  >
                    {status.loading ? "Authenticating..." : "Authorize Payment"}
                  </button>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center mt-4 leading-relaxed">
                    Transactions are secured via Razorpay. Order finalized upon authorization.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
