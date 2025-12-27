import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, formatPrice } from "../utils/format.js";

export default function Orders() {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/orders", { auth: true });
        if (!active) return;
        setOrders(data || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load orders.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-inner">
        <h2 className="text-2xl font-semibold">Login required</h2>
        <p className="text-slate-600">Sign in to view your order history.</p>
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg" to="/login">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-12">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Your Orders</h1>
          <p className="text-slate-600">Track the status of every purchase.</p>
          {user?.name && <p className="text-sm text-slate-500">Signed in as {user.name}</p>}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-white/80 p-4 shadow">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
              <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
              <div className="mt-3 h-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.length ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-lg font-semibold text-slate-900">Order #{order.id}</p>
                    <p className="m-0 text-sm text-slate-600">Placed on {formatDate(order.createdAt)}</p>
                    <p className="m-0 text-sm text-slate-600">Payment method: {order.paymentMethod || "razorpay"}</p>
                  </div>
                  <div className="text-right">
                    {order.status && (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                          order.status?.toLowerCase() === "paid"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : order.status?.toLowerCase() === "cancelled"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        {order.status === "CANCELLED" && order.paymentMethod === "razorpay"
                          ? "FAILED"
                          : order.status}
                      </span>
                    )}
                    <p className="m-0 mt-2 font-semibold text-slate-900">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
                {(order.paymentId || order.razorpayOrderId || order.razorpaySignature) && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="m-0 font-semibold text-slate-800">Payment details</p>
                    {order.paymentId && <p className="m-0">Payment ID: {order.paymentId}</p>}
                    {order.razorpayOrderId && <p className="m-0">Razorpay Order: {order.razorpayOrderId}</p>}
                    {order.razorpaySignature && <p className="m-0">Signature: {order.razorpaySignature}</p>}
                  </div>
                )}
                {(order.trackingCode || order.trackingCarrier) && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="m-0 font-semibold text-slate-800">Tracking</p>
                    {order.trackingCode && <p className="m-0">Code: {order.trackingCode}</p>}
                    {order.trackingCarrier && <p className="m-0">Carrier: {order.trackingCarrier}</p>}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 shadow-inner">
              No orders yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
