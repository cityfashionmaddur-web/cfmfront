import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminGet, adminPut } from "../../utils/adminApi.js";
import { formatDate, formatPrice } from "../../utils/format.js";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: "", saving: false });
  const [nextStatus, setNextStatus] = useState("");
  const [trackingDraft, setTrackingDraft] = useState({ trackingCode: "", trackingCarrier: "" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatus({ loading: true, error: "", saving: false });
      try {
        const data = await adminGet(`/admin/orders/${id}`);
        if (!active) return;
        setOrder(data);
        setNextStatus(data?.status || "PENDING");
        setTrackingDraft({
          trackingCode: data?.trackingCode || "",
          trackingCarrier: data?.trackingCarrier || ""
        });
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load order." }));
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (!order || nextStatus === order.status) return;
    setStatus((prev) => ({ ...prev, saving: true, error: "" }));
    try {
      const updated = await adminPut(`/admin/orders/${order.id}/status`, { status: nextStatus });
      setOrder((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to update status." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleSaveTracking = async () => {
    if (!order) return;
    setStatus((prev) => ({ ...prev, saving: true, error: "" }));
    try {
      const payload = {
        trackingCode: trackingDraft.trackingCode || null,
        trackingCarrier: trackingDraft.trackingCarrier || null
      };
      const updated = await adminPut(`/admin/orders/${order.id}/tracking`, payload);
      setOrder((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to update tracking." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Order #{id}</h1>
          <p>Order details and fulfillment workflow.</p>
        </div>
        <Link className="link" to="/admin/orders">
          Back to orders
        </Link>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="loading">Loading order...</div>
      ) : order ? (
        <div className="admin-grid">
          <div className="panel admin-animate">
            <div className="admin-section-header">
              <div>
                <h2>Items</h2>
                <p>Placed on {formatDate(order.createdAt)}.</p>
              </div>
            </div>
            <div className="admin-list">
              {order.items?.length ? (
                order.items.map((item) => (
                  <div key={item.id} className="admin-list-row">
                    <div>
                      <p className="admin-list-title">{item.product?.title || "Product"}</p>
                      <p className="admin-list-meta">Qty {item.quantity}</p>
                    </div>
                    <span className="admin-pill">{formatPrice(item.price)}</span>
                  </div>
                ))
              ) : (
                <p className="helper">No items found.</p>
              )}
            </div>
          </div>

          <div className="panel admin-animate">
            <div className="admin-section-header">
              <div>
                <h2>Summary</h2>
                <p>Customer and shipping details.</p>
              </div>
            </div>
            <div className="admin-summary">
              <div className="admin-summary-row">
                <span>Customer</span>
                <span>{order.user?.email || "-"}</span>
              </div>
              <div className="admin-summary-row">
                <span>Status</span>
                <span className={`status status-${order.status?.toLowerCase() || "pending"}`}>
                  {order.status}
                </span>
              </div>
              <div className="admin-summary-row">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
            <div className="admin-summary">
              <div className="admin-summary-row">
                <span>Payment method</span>
                <span>{order.paymentMethod || "razorpay"}</span>
              </div>
              {order.paymentId && (
                <div className="admin-summary-row">
                  <span>Payment ID</span>
                  <span>{order.paymentId}</span>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="admin-summary-row">
                  <span>Razorpay Order</span>
                  <span>{order.razorpayOrderId}</span>
                </div>
              )}
              {order.razorpaySignature && (
                <div className="admin-summary-row">
                  <span>Signature</span>
                  <span className="break-all">{order.razorpaySignature}</span>
                </div>
              )}
              {(order.paymentErrorCode || order.paymentErrorDescription) && (
                <div className="admin-summary-row">
                  <span>Payment error</span>
                  <span className="break-all">
                    {[order.paymentErrorCode, order.paymentErrorDescription].filter(Boolean).join(" - ")}
                  </span>
                </div>
              )}
            </div>
            <div className="admin-status-update">
              <select className="input" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" type="button" onClick={handleSave} disabled={status.saving}>
                {status.saving ? "Updating..." : "Update status"}
              </button>
            </div>

            <div className="admin-status-update">
              <div className="flex flex-col gap-2 w-full">
                <input
                  className="input"
                  placeholder="Tracking code"
                  value={trackingDraft.trackingCode}
                  onChange={(e) => setTrackingDraft((prev) => ({ ...prev, trackingCode: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Carrier (optional)"
                  value={trackingDraft.trackingCarrier}
                  onChange={(e) => setTrackingDraft((prev) => ({ ...prev, trackingCarrier: e.target.value }))}
                />
              </div>
              <button className="btn btn-outline" type="button" onClick={handleSaveTracking} disabled={status.saving}>
                {status.saving ? "Saving..." : "Update tracking"}
              </button>
            </div>

            <div className="admin-address">
              <h3>Shipping address</h3>
              <p>{order.addressLine1 || "-"}</p>
              {order.addressLine2 && <p>{order.addressLine2}</p>}
              <p>{[order.city, order.state, order.postalCode].filter(Boolean).join(", ")}</p>
              <p>{order.country}</p>
              <p>{order.phone}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">Order not found.</div>
      )}
    </div>
  );
}
