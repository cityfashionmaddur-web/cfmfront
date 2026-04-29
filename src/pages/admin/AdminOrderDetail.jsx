import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminGet, adminPut, adminPost } from "../../utils/adminApi.js";
import { formatDate, formatPrice } from "../../utils/format.js";
import { 
  ArrowLeft, 
  ShoppingBag, 
  User, 
  MapPin, 
  CreditCard, 
  Truck, 
  Calendar, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Phone,
  Mail,
  Hash,
  ChevronRight,
  Package,
  RefreshCw
} from "lucide-react";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_ICONS = {
  PENDING: Clock,
  PAID: CheckCircle2,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: "", saving: false, verifying: false });
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

  const handleVerifyPayment = async () => {
    if (!order) return;
    setStatus((prev) => ({ ...prev, verifying: true, error: "" }));
    try {
      const res = await adminPost(`/payments/razorpay/verify/${order.id}`);
      if (res.status) {
        setOrder((prev) => ({ ...prev, status: res.status }));
        setNextStatus(res.status);
      }
      alert(res.message || "Verification finished");
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to verify payment." }));
    } finally {
      setStatus((prev) => ({ ...prev, verifying: false }));
    }
  };

  if (status.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="h-12 w-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-bold tracking-tight">Locating order record...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <XCircle size={48} className="text-slate-200 mb-4" />
        <h2 className="text-xl font-black text-slate-900">Order Not Found</h2>
        <p className="text-slate-500 mt-1 mb-6">This reference ID does not exist in our database.</p>
        <Link to="/admin/orders" className="btn btn-primary">Return to Orders</Link>
      </div>
    );
  }

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-8 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black tracking-tight text-slate-900">Order #{order.id.toString().slice(-6)}</h1>
               <StatusBadge status={order.status} />
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Calendar size={14} />
              <span>Initiated on {formatDate(order.createdAt)}</span>
            </p>
          </div>
        </div>
      </section>

      {status.error && <div className="alert bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-6 font-bold text-sm">{status.error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Transaction Details */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShoppingBag size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Purchase Items</h2>
            </div>
            
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-6 p-4 rounded-3xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 transition-all">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate">{item.product?.title || "Legacy Product Item"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>{item.size || "standard"}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                      <span>Qty {item.quantity}</span>
                    </div>
                    {item.product?.availableColors && (
                      <div className="mt-3 inline-flex bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
                        {item.product.availableColors.split(",").map((c, i) => (
                          <div key={i} className={`px-3 py-1.5 text-slate-600 text-[9px] font-black uppercase tracking-widest flex items-center justify-center ${i !== 0 ? 'border-l border-slate-200' : ''}`}>
                            {c.trim()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{formatPrice(item.price)} ea.</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 space-y-3">
               <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.totalAmount)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                  <span>Standard Fulfillment</span>
                  <span className="text-emerald-500">Free</span>
               </div>
               <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-black text-slate-900">Total Settlement</span>
                  <span className="text-2xl font-black text-slate-900">{formatPrice(order.totalAmount)}</span>
               </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
             <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                 <Truck size={18} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-white tracking-tight">Fullfillment Workflow</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 px-1">Logistic Status</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm outline-none focus:border-indigo-500 transition-all appearance-none"
                        value={nextStatus} 
                        onChange={(e) => setNextStatus(e.target.value)}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-slate-900">{opt}</option>
                        ))}
                      </select>
                      <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                  <button 
                    className="w-full btn bg-indigo-600 text-white hover:bg-indigo-700 py-4 rounded-2xl shadow-xl shadow-indigo-950 transition-all font-black text-sm uppercase tracking-widest disabled:opacity-50"
                    onClick={handleSave}
                    disabled={status.saving || nextStatus === order.status}
                  >
                    {status.saving ? "UPDATING..." : "COMMIT STATUS CHANGE"}
                  </button>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 px-1">Tracking Logistics</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                      placeholder="Waybill / Tracking #"
                      value={trackingDraft.trackingCode}
                      onChange={(e) => setTrackingDraft(p => ({ ...p, trackingCode: e.target.value }))}
                    />
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                      placeholder="Carrier (e.g., Delhivery)"
                      value={trackingDraft.trackingCarrier}
                      onChange={(e) => setTrackingDraft(p => ({ ...p, trackingCarrier: e.target.value }))}
                    />
                  </div>
                  <button 
                    className="w-full py-4 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    onClick={handleSaveTracking}
                    disabled={status.saving}
                  >
                    <Save size={16} />
                    <span>Synchronize Tracking</span>
                  </button>
               </div>
             </div>
          </section>
        </div>

        {/* Right Column: Customer & Payment */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <User size={18} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-slate-800 tracking-tight">Customer</h2>
             </div>
             
             <div className="flex items-center gap-4 mb-8 p-1">
                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400 uppercase border-2 border-slate-50">
                  {order.user?.name?.slice(0, 1) || "G"}
                </div>
                <div>
                  <p className="font-black text-slate-900 leading-tight">{order.user?.name || "Guest Account"}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">ID: #{order.user?.id || "N/A"}</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600 group">
                   <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <Mail size={14} />
                   </div>
                   <span className="text-sm font-bold truncate">{order.user?.email || "No email available"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 group">
                   <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <Phone size={14} />
                   </div>
                   <span className="text-sm font-bold">{order.phone || "No phone listed"}</span>
                </div>
             </div>

             <div className="mt-10 pt-8 border-t border-slate-100">
               <div className="flex items-center gap-3 mb-4">
                 <MapPin size={16} className="text-indigo-500" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Shipping Domain</h3>
               </div>
               <div className="bg-slate-50 rounded-3xl p-6 text-sm font-bold text-slate-600 leading-relaxed border border-slate-100">
                 <p className="text-slate-900 font-black mb-1">{order.user?.name || "Recipient"}</p>
                 <p>{order.addressLine1}</p>
                 {order.addressLine2 && <p>{order.addressLine2}</p>}
                 <p>{order.city}, {order.state} {order.postalCode}</p>
                 <p className="mt-2 text-indigo-600 uppercase text-[10px] tracking-widest font-black">{order.country || "India"}</p>
               </div>
             </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <CreditCard size={18} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-slate-800 tracking-tight">Payment</h2>
             </div>

             <div className="space-y-5">
                <div className="bg-indigo-50/50 rounded-2xl p-4 flex items-center justify-between border border-indigo-100">
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Provider</span>
                   <span className="text-sm font-black text-indigo-800 uppercase">{order.paymentMethod || "Razorpay"}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                   <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Reference</span>
                   </div>
                   <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-400">Payment ID</span>
                         <code className="text-[11px] font-black text-slate-900">{order.paymentId || "Unconfirmed"}</code>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-400">Gateway Order</span>
                         <code className="text-[11px] font-black text-slate-900 truncate max-w-[140px]">{order.razorpayOrderId || "N/A"}</code>
                      </div>
                   </div>
                </div>

                 {(order.paymentId || order.razorpayOrderId) && !['PAID', 'DELIVERED', 'SHIPPED', 'CANCELLED'].includes(order.status) && (
                   <div className="pt-2 pb-2">
                     <button
                       onClick={handleVerifyPayment}
                       disabled={status.verifying}
                       className="w-full btn bg-slate-900 text-white hover:bg-black py-3 rounded-2xl shadow-md transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                       {status.verifying ? (
                         <RefreshCw size={14} className="animate-spin" />
                       ) : (
                         <RefreshCw size={14} />
                       )}
                       {status.verifying ? "VERIFYING..." : "VERIFY PAYMENT"}
                     </button>
                   </div>
                 )}

                {(order.paymentErrorCode || order.paymentErrorDescription) && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                       <XCircle size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Gateway Error</span>
                    </div>
                    <p className="text-xs text-red-600 font-bold leading-relaxed">
                      {[order.paymentErrorCode, order.paymentErrorDescription].filter(Boolean).join(": ")}
                    </p>
                  </div>
                )}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || Clock;
  const colorMap = {
    PENDING: "bg-slate-100 text-slate-500 border-slate-200",
    PAID: "bg-indigo-50 text-indigo-600 border-indigo-100",
    SHIPPED: "bg-blue-50 text-blue-600 border-blue-100",
    DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    CANCELLED: "bg-red-50 text-red-600 border-red-100",
  };
  
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${colorMap[status] || colorMap.PENDING}`}>
      <Icon size={12} strokeWidth={3} />
      <span>{status}</span>
    </div>
  );
}
