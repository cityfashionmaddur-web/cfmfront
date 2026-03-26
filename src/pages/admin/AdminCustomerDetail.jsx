import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminGet } from "../../utils/adminApi.js";
import { formatDate, formatPrice } from "../../utils/format.js";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  ShoppingBag, 
  ExternalLink, 
  Hash, 
  Smartphone,
  Shield,
  Clock,
  ChevronRight,
  Package
} from "lucide-react";

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatus({ loading: true, error: "" });
      try {
        const [data, orderData] = await Promise.all([
          adminGet(`/admin/customers/${id}`),
          adminGet(`/admin/customers/${id}/orders`)
        ]);
        if (!active) return;
        setCustomer(data);
        setOrders(orderData || []);
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load customer." }));
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (status.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="h-10 w-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-bold tracking-tight uppercase text-[10px] tracking-[0.2em]">Retrieving profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
         <User size={48} className="text-slate-200 mb-4" />
         <h2 className="text-xl font-black text-slate-900">Account Not Found</h2>
         <p className="text-slate-500 mt-1 mb-6">This customer reference does not exist.</p>
         <Link to="/admin/customers" className="btn btn-primary">Back to Directory</Link>
      </div>
    );
  }

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-8 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/customers" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Customer Intelligence</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Hash size={14} />
              <span>System Reference: {id}</span>
            </p>
          </div>
        </div>
      </section>

      {status.error && (
        <div className="alert bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-8 font-bold text-sm">
          {status.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-5 space-y-8">
           <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 -z-0"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="h-24 w-24 rounded-[2rem] bg-white border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-indigo-600 mb-4">
                      {customer.name?.slice(0, 1) || "G"}
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">{customer.name || "Anonymous User"}</h2>
                   <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                      <Shield size={12} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">{customer.role || "CUSTOMER"}</span>
                   </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-slate-100">
                   <div className="flex items-center gap-4 group">
                      <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <Mail size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Contact Channel</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{customer.email || "No email provided"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 group">
                      <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <Calendar size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Membership Tenure</p>
                        <p className="text-sm font-bold text-slate-700 truncate">Joined on {formatDate(customer.createdAt)}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 group">
                      <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <Smartphone size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Registered Phone</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{customer.phone || "No device linked"}</p>
                      </div>
                   </div>
                </div>
              </div>
           </section>

           <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MapPin size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Geo-Filing</h2>
              </div>
              
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-2">
                 <p className="text-sm font-bold text-slate-700 leading-relaxed">
                   {customer.addressLine1 || "Primary address line missing"}
                 </p>
                 {customer.addressLine2 && (
                   <p className="text-sm font-bold text-slate-700 leading-relaxed">{customer.addressLine2}</p>
                 )}
                 <div className="pt-2 flex flex-wrap gap-2">
                    {[customer.city, customer.state, customer.postalCode].filter(Boolean).map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-tighter shadow-sm">{tag}</span>
                    ))}
                 </div>
                 <p className="mt-4 pt-4 border-t border-slate-200/50 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">{customer.country || "India"}</p>
              </div>
           </section>
        </div>

        {/* Right Column: Order Ledger */}
        <div className="lg:col-span-7 space-y-8">
           <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShoppingBag size={18} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Transaction Ledger</h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                   <Clock size={12} strokeWidth={3} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{orders.length} Sessions</span>
                </div>
              </div>

              {orders.length ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link 
                      key={order.id} 
                      to={`/admin/orders/${order.id}`}
                      className="group flex items-center justify-between p-5 rounded-3xl border border-slate-50 hover:border-indigo-100 hover:bg-slate-50/50 transition-all bg-white"
                    >
                      <div className="flex items-center gap-5">
                         <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Package size={20} />
                         </div>
                         <div>
                            <p className="font-black text-slate-900 flex items-center gap-2">
                               <span>Order #{order.id.toString().slice(-6)}</span>
                               <ChevronRight size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{formatDate(order.createdAt)}</p>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 text-right">
                         <p className="text-sm font-black text-slate-900">{formatPrice(order.totalAmount)}</p>
                         <StatusLabel status={order.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
                   <Package size={48} strokeWidth={1} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No historical transactions</p>
                </div>
              )}
           </section>
        </div>
      </div>
    </div>
  );
}

function StatusLabel({ status }) {
  const colorMap = {
    PAID: "bg-indigo-50 text-indigo-600 border-indigo-100",
    DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    CANCELLED: "bg-red-50 text-red-600 border-red-100",
    PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    SHIPPED: "bg-blue-50 text-blue-600 border-blue-100",
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-tighter ${colorMap[status] || "bg-slate-50 text-slate-400 border-slate-200"}`}>
      {status}
    </span>
  );
}
