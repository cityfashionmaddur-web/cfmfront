import React, { useState } from "react";
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

  React.useEffect(() => {
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
          error: message || "Payment was not completed. Order cancelled.",
          success: ""
        });
      }
    };

    const rzp = new window.Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: "CITYFASHION MADDUR",
      description: "Order payment",
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
            success: `Payment received. Order #${localOrderId} placed. It will update to PAID once Razorpay confirms.`
          });
        } catch (err) {
          setStatus({
            loading: false,
            error: err.message || "Payment captured. Order will sync once we receive Razorpay confirmation.",
            success: ""
          });
        }
      },
      modal: {
        ondismiss: () => cancelOrder("Payment window closed. Order cancelled.")
      },
      theme: {
        color: "#1a1814"
      }
    });

    rzp.on("payment.failed", () => cancelOrder("Payment failed. Order cancelled."));

    rzp.open();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!items.length) return;
    if (total <= 0) {
      setStatus({ loading: false, error: "Cart total must be above zero to pay.", success: "" });
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
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          ...formState
        },
        { auth: true }
      );

      await launchRazorpay(orderPayload);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message || "Failed to start payment.",
        success: ""
      });
    }
  };

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-inner">
        <h2 className="text-2xl font-semibold">No items to checkout</h2>
        <p className="text-slate-600">Your cart is empty. Add items before placing an order.</p>
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg" to="/products">
          Browse products
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-inner">
        <h2 className="text-2xl font-semibold">Login required</h2>
        <p className="text-slate-600">Checkout needs a verified account so we can attach your order to a profile.</p>
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg" to="/login">
          Continue to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-12">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-600">Delivery, payment, and summary in a single flow.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
              ✔ Secure payment
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
              ↻ 7-day returns
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-900 bg-slate-900 text-white text-xs">
            1
          </span>
          <span className="text-slate-900">Bag</span>
          <span className="mx-2 h-px w-8 bg-slate-200" />
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 text-xs">
            2
          </span>
          <span className="text-slate-500">Payment</span>
          <span className="mx-2 h-px w-8 bg-slate-200" />
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 text-xs">
            3
          </span>
          <span className="text-slate-500">Checkout</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Delivery details</h2>
                <p className="text-sm text-slate-600">Saved to your profile for next time.</p>
              </div>
              {hasSavedAddress && (
                <button
                  type="button"
                  onClick={applySavedAddress}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                >
                  Use saved address
                </button>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Address line 1</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Street address"
                    value={formState.addressLine1}
                    onChange={(event) => updateField("addressLine1", event.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Address line 2</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Apartment, suite, etc."
                    value={formState.addressLine2}
                    onChange={(event) => updateField("addressLine2", event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>City</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="City"
                    value={formState.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>State</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="State"
                    value={formState.state}
                    onChange={(event) => updateField("state", event.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Postal code</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Postal code"
                    value={formState.postalCode}
                    onChange={(event) => updateField("postalCode", event.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Country</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Country"
                    value={formState.country}
                    onChange={(event) => updateField("country", event.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Phone</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Phone"
                    value={formState.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                  />
                </label>
              </div>

              {status.error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{status.error}</div>
              )}
              {status.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status.success}</div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={status.loading}
                >
                  {status.loading ? "Placing order..." : "Place order"}
                </button>
                <p className="text-xs text-slate-600">
                  Orders are created before payment and auto-marked paid when Razorpay confirms.
                </p>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Items</span>
              <span>{items.length} {items.length === 1 ? "item" : "items"}</span>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No image</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-600">Qty {item.quantity}</p>
                      <p className="text-xs text-slate-600">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatPrice(Number(item.price || 0) * (item.quantity || 1))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">{formatPrice(shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Checkout uses Razorpay. Your order is created before payment and is auto-marked paid once Razorpay confirms.
          </p>
        </aside>
      </div>
    </div>
  );
}
