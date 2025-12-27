import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminGet, adminPut } from "../../utils/adminApi.js";
import { formatDate, formatPrice } from "../../utils/format.js";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", savingId: null, savingTrackingId: null });
  const [draftStatus, setDraftStatus] = useState({});
  const [draftTracking, setDraftTracking] = useState({});
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus({ loading: true, error: "", savingId: null, savingTrackingId: null });
      try {
        const query = new URLSearchParams();
        if (filters.status) query.set("status", filters.status);
        if (filters.from) query.set("from", filters.from);
        if (filters.to) query.set("to", filters.to);
        query.set("page", String(page));
        query.set("pageSize", String(pageSize));
        const res = await adminGet(`/admin/orders?${query.toString()}`);
        const data = res?.data || [];
        if (!active) return;
        setOrders(data || []);
        setTotal(res?.total || data.length);
        // Seed drafts with existing values
        const trackingSeed = {};
        data.forEach((order) => {
          trackingSeed[order.id] = {
            trackingCode: order.trackingCode || "",
            trackingCarrier: order.trackingCarrier || ""
          };
        });
        setDraftTracking(trackingSeed);
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load orders." }));
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [filters.status, page]);

  const handleStatusChange = (id, value) => {
    setDraftStatus((prev) => ({ ...prev, [id]: value }));
  };

  const handleTrackingChange = (id, key, value) => {
    setDraftTracking((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: value }
    }));
  };

  const handleSave = async (order) => {
    const nextStatus = draftStatus[order.id] || order.status;
    if (!nextStatus || nextStatus === order.status) return;
    setStatus((prev) => ({ ...prev, savingId: order.id, error: "" }));
    try {
      const updated = await adminPut(`/admin/orders/${order.id}/status`, { status: nextStatus });
      setOrders((prev) => prev.map((item) => (item.id === order.id ? { ...item, ...updated } : item)));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to update status." }));
    } finally {
      setStatus((prev) => ({ ...prev, savingId: null }));
    }
  };

  const handleSaveTracking = async (order) => {
    const draft = draftTracking[order.id] || {};
    setStatus((prev) => ({ ...prev, savingTrackingId: order.id, error: "" }));
    try {
      const payload = {
        trackingCode: draft.trackingCode || null,
        trackingCarrier: draft.trackingCarrier || null
      };
      const updated = await adminPut(`/admin/orders/${order.id}/tracking`, payload);
      setOrders((prev) => prev.map((item) => (item.id === order.id ? { ...item, ...updated } : item)));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to update tracking." }));
    } finally {
      setStatus((prev) => ({ ...prev, savingTrackingId: null }));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const setDateRange = (range) => {
    const today = new Date();
    const format = (d) => d.toISOString().split("T")[0];
    if (range === "today") {
      const day = format(today);
      handleFilterChange("from", day);
      handleFilterChange("to", day);
    } else if (range === "week") {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      handleFilterChange("from", format(start));
      handleFilterChange("to", format(today));
    } else if (range === "month") {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      handleFilterChange("from", format(start));
      handleFilterChange("to", format(today));
    } else {
      handleFilterChange("from", "");
      handleFilterChange("to", "");
    }
  };

  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const prevPage = () => setPage((p) => Math.max(1, p - 1));

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Orders</h1>
          <p>Track customer purchases and fulfillment status.</p>
        </div>
        <div className="admin-inline gap-2">
          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
          />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <button className="btn btn-ghost" type="button" onClick={() => setDateRange("today")}>
              Today
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setDateRange("week")}>
              Last 7d
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setDateRange("month")}>
              Last 30d
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setDateRange("all")}>
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <button className="btn btn-outline" type="button" onClick={prevPage} disabled={page === 1}>
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button className="btn btn-outline" type="button" onClick={nextPage} disabled={page === totalPages}>
              Next
            </button>
          </div>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-white/80 p-4 shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-4 w-16 rounded bg-slate-200" />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td>#{order.id}</td>
                    <td>{order.user?.email || "-"}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td className="text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">{order.paymentMethod || "razorpay"}</div>
                      {order.paymentId && <div>Payment ID: {order.paymentId}</div>}
                      {order.razorpayOrderId && <div>Order: {order.razorpayOrderId}</div>}
                    </td>
                    <td>
                      <span className={`status status-${order.status?.toLowerCase() || "pending"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700">
                      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">Tracking</span>
                          {(order.trackingCode || order.trackingCarrier) && (
                            <span className="text-[11px] text-emerald-600 font-semibold">Saved</span>
                          )}
                        </div>
                        <input
                          className="input"
                          placeholder="Tracking code"
                          value={draftTracking[order.id]?.trackingCode || ""}
                          onChange={(e) => handleTrackingChange(order.id, "trackingCode", e.target.value)}
                        />
                        <input
                          className="input"
                          placeholder="Carrier (e.g., Bluedart, Delhivery)"
                          value={draftTracking[order.id]?.trackingCarrier || ""}
                          onChange={(e) => handleTrackingChange(order.id, "trackingCarrier", e.target.value)}
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Visible to customer on Orders</span>
                          <button
                            className="btn btn-ghost btn-sm"
                            type="button"
                            onClick={() => handleSaveTracking(order)}
                            disabled={status.savingTrackingId === order.id}
                          >
                            {status.savingTrackingId === order.id ? "Saving..." : "Save"}
                          </button>
                        </div>
                        {(order.trackingCode || order.trackingCarrier) && (
                          <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
                            {order.trackingCode} {order.trackingCarrier ? `(${order.trackingCarrier})` : ""}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{formatPrice(order.totalAmount)}</td>
                    <td>
                      <div className="admin-inline">
                        <Link className="btn btn-outline" to={`/admin/orders/${order.id}`}>
                          View
                        </Link>
                        <select
                          className="input"
                          value={draftStatus[order.id] || order.status}
                          onChange={(event) => handleStatusChange(order.id, event.target.value)}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() => handleSave(order)}
                          disabled={status.savingId === order.id}
                        >
                          {status.savingId === order.id ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
