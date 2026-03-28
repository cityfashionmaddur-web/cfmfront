import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminGet, adminPut } from "../../utils/adminApi.js";
import { formatDate, formatPrice } from "../../utils/format.js";
import { 
  ShoppingBag, 
  Search, 
  Calendar, 
  Filter, 
  Save, 
  Eye, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Clock,
  ChevronRight
} from "lucide-react";
import useDebounce from "../../hooks/useDebounce.js";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_ICONS = {
  PENDING: Clock,
  PAID: CheckCircle2,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", savingId: null, savingTrackingId: null });
  const [draftStatus, setDraftStatus] = useState({});
  const [draftTracking, setDraftTracking] = useState({});
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
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
        if (debouncedSearch) query.set("search", debouncedSearch);
        query.set("page", String(page));
        query.set("pageSize", String(pageSize));
        const res = await adminGet(`/admin/orders?${query.toString()}`);
        const data = res?.data || [];
        if (!active) return;
        setOrders(data || []);
        setTotal(res?.total || data.length);
        
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
  }, [filters.status, page, debouncedSearch]);

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
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-8 mb-4 flex-col lg:flex-row items-start lg:items-end gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Monitor and fulfill customer acquisitions.</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search orders..." 
                className="pl-9 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm w-full md:w-48"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white cursor-pointer appearance-none"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <input
                type="date"
                className="bg-transparent border-none focus:ring-0 text-xs text-slate-600 font-bold px-3 py-1.5"
                value={filters.from}
                onChange={(e) => handleFilterChange("from", e.target.value)}
              />
              <span className="text-slate-300">|</span>
              <input
                type="date"
                className="bg-transparent border-none focus:ring-0 text-xs text-slate-600 font-bold px-3 py-1.5"
                value={filters.to}
                onChange={(e) => handleFilterChange("to", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 px-1">
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
              <button onClick={() => setDateRange("today")} className="text-slate-500 hover:text-indigo-600 transition-colors">Today</button>
              <button onClick={() => setDateRange("week")} className="text-slate-500 hover:text-indigo-600 transition-colors">7 Days</button>
              <button onClick={() => setDateRange("month")} className="text-slate-500 hover:text-indigo-600 transition-colors">30 Days</button>
              <button 
                onClick={() => setDateRange("all")} 
                className="text-red-500/60 hover:text-red-600"
              >
                Reset
              </button>
            </div>
            
            <div className="flex items-center gap-3 ml-auto lg:ml-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={prevPage} 
                  disabled={page === 1}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                  {page} / {totalPages}
                </span>
                <button 
                  onClick={nextPage} 
                  disabled={page === totalPages}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      
      {status.loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="animate-pulse h-32 rounded-[2rem] bg-slate-100/50 border border-slate-100"></div>
          ))}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Purchaser</th>
                <th>Items</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Fulfilment</th>
                <th>Last Update</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td>
                      <div className="font-black text-slate-900">#{order.id.toString().slice(-6)}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {order.id}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                          {order.user?.name?.slice(0, 1) || "G"}
                        </div>
                        <div className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                          {order.user?.email || "Guest User"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                        {order.items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-1.5 text-xs">
                             <span className="font-bold text-slate-700 truncate max-w-[120px]" title={item.product?.title || "Product"}>
                               {item.product?.title || "Product"}
                             </span>
                             {item.size && (
                               <span className="bg-slate-100 text-slate-500 font-black uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded-md border border-slate-200">
                                  {item.size}
                               </span>
                             )}
                             <span className="text-slate-400 font-bold text-[10px]">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <div className="text-[10px] font-bold text-indigo-500 tracking-wide">
                            + {order.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-slate-600 font-medium">{formatDate(order.createdAt)}</div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{order.paymentMethod || "razorpay"}</span>
                        <span className="text-sm font-black text-slate-900">{formatPrice(order.totalAmount)}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tracking</span>
                           {order.trackingCode && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>}
                        </div>
                        <input
                          className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          placeholder="Code"
                          value={draftTracking[order.id]?.trackingCode || ""}
                          onChange={(e) => handleTrackingChange(order.id, "trackingCode", e.target.value)}
                        />
                        <div className="flex items-center justify-between gap-1">
                          <input
                            className="flex-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            placeholder="Carrier"
                            value={draftTracking[order.id]?.trackingCarrier || ""}
                            onChange={(e) => handleTrackingChange(order.id, "trackingCarrier", e.target.value)}
                          />
                          <button
                            className="p-1 px-2 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                            type="button"
                            onClick={() => handleSaveTracking(order)}
                            disabled={status.savingTrackingId === order.id}
                          >
                            <Save size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all" to={`/admin/orders/${order.id}`}>
                          <Eye size={18} />
                        </Link>
                        <div className="relative group/sel">
                          <select
                            className="pl-2 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-bold appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            value={draftStatus[order.id] || order.status}
                            onChange={(event) => handleStatusChange(order.id, event.target.value)}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                        </div>
                        <button
                          className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                          type="button"
                          onClick={() => handleSave(order)}
                          disabled={status.savingId === order.id}
                        >
                          {status.savingId === order.id ? (
                            <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Save size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShoppingBag size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-medium text-lg text-slate-500">No purchase records</p>
                    </div>
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

function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || Clock;
  const colorClass = `status-${status?.toLowerCase() || "pending"}`;
  
  return (
    <div className={`status ${colorClass} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full`}>
      <Icon size={12} strokeWidth={3} />
      <span className="font-black text-[10px] uppercase tracking-wider">{status}</span>
    </div>
  );
}
