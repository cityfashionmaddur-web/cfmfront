import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, formatPrice } from "../utils/format.js";
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronRight, ShoppingBag } from "lucide-react";

const getStatusIcon = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return <Clock size={16} strokeWidth={2} />;
    case 'PAID': return <CheckCircle size={16} strokeWidth={2} />;
    case 'SHIPPED': return <Truck size={16} strokeWidth={2} />;
    case 'DELIVERED': return <Package size={16} strokeWidth={2} />;
    case 'CANCELLED': return <XCircle size={16} strokeWidth={2} />;
    default: return <Clock size={16} strokeWidth={2} />;
  }
};

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Authentication Required</h2>
        <p className="text-gray-500 mb-8 max-w-sm text-center">Gain access to your exclusive purchase history by signing in to your account.</p>
        <Link className="px-8 py-3 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors" to="/login">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Order Archive</h1>
          <p className="text-gray-500 tracking-wide">A comprehensive record of your acquisitions.</p>
        </div>
        <div className="text-sm font-bold uppercase tracking-widest text-gray-400">
          Client: {user?.name || "Guest"}
        </div>
      </div>

      {error && (
        <div className="bg-black text-white px-6 py-4 mb-8 text-sm font-bold uppercase tracking-widest flex items-center gap-3">
          <XCircle size={18} />
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="animate-pulse bg-neutral-100 h-64 w-full"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {orders.length ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="group border border-gray-200 hover:border-black transition-colors bg-white overflow-hidden flex flex-col lg:flex-row"
              >
                {/* Order Summary & Status Header */}
                <div className="lg:w-1/3 bg-neutral-50 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-gray-200">
                   <div>
                     <div className="flex items-center gap-3 mb-6">
                       <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-widest ${
                          order.status === "CANCELLED" ? "bg-red-50 text-red-600" : "bg-black text-white"
                       }`}>
                         {getStatusIcon(order.status)}
                         {order.status === "CANCELLED" && order.paymentMethod === "razorpay"
                           ? "FAILED"
                           : order.status}
                       </span>
                     </div>
                     <p className="text-3xl font-black tracking-tight mb-2">#{order.id.toString().padStart(5, '0')}</p>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Placed on {formatDate(order.createdAt)}</p>
                     
                     <div className="space-y-4 text-sm mb-8">
                       <div className="flex justify-between border-b border-gray-200 pb-2">
                         <span className="font-bold text-gray-500">Logistics</span>
                         <span className="font-black tracking-wide text-right">{order.trackingCarrier || "Standard"}</span>
                       </div>
                       {order.trackingCode && (
                         <div className="flex justify-between border-b border-gray-200 pb-2">
                           <span className="font-bold text-gray-500">Waybill</span>
                           <span className="font-black tracking-wide">{order.trackingCode}</span>
                         </div>
                       )}
                       <div className="flex justify-between pb-2">
                         <span className="font-bold text-gray-500">Payment</span>
                         <span className="font-black tracking-wide uppercase">{order.paymentMethod || "razorpay"}</span>
                       </div>
                     </div>
                   </div>

                   <div className="pt-6 border-t border-gray-200">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Settlement</p>
                     <p className="text-2xl font-black">{formatPrice(order.totalAmount)}</p>
                   </div>
                </div>

                {/* Items List */}
                <div className="lg:w-2/3 p-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                     <ShoppingBag size={14} /> Itemization
                  </h3>
                  <div className="space-y-6">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-6 group/item">
                        <div className="w-24 h-32 bg-neutral-100 overflow-hidden flex-shrink-0">
                          {item.product?.images?.[0] ? (
                            <img src={item.product.images[0]} alt={item.product?.title} className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <h4 className="text-lg font-black tracking-tight mb-1 group-hover/item:text-gray-600 transition-colors">
                            {item.product?.title || "Legacy Product Item"}
                          </h4>
                          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                            <span>{item.size || "Standard"}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <p className="font-black text-gray-900">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="border border-gray-200 bg-neutral-50 px-8 py-24 flex flex-col items-center justify-center text-center">
              <ShoppingBag size={48} className="text-gray-200 mb-6" strokeWidth={1} />
              <h3 className="text-xl font-black uppercase tracking-widest mb-2">No Acquisitions Found</h3>
              <p className="text-gray-500 mb-8 max-w-sm">Your order archive is currently empty. Discover our latest collection to begin your journey.</p>
              <Link className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors" to="/products">
                Explore Collection
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
