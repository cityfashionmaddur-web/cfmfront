
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminGet } from "../../utils/adminApi.js";
import { formatPrice } from "../../utils/format.js";
import { 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff,
  ChevronRight,
  PlusCircle,
  Settings,
  List
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [slides, setSlides] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [hideRevenue, setHideRevenue] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus({ loading: true, error: "" });
      try {
        const [statsData, productData, slideData] = await Promise.all([
          adminGet("/admin/stats"),
          adminGet("/admin/products"),
          adminGet("/admin/hero")
        ]);
        if (!active) return;
        setStats(statsData);
        setProducts(productData || []);
        setSlides(slideData || []);
      } catch (err) {
        if (!active) return;
        setStatus({ loading: false, error: err.message || "Failed to load dashboard." });
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const lowStock = useMemo(
    () => products.filter((item) => (item.variants?.reduce((sum, v) => sum + v.stock, 0) || 0) <= 5).slice(0, 5),
    [products]
  );

  const statsCards = [
    { 
      label: "Total Products", 
      value: stats?.totalProducts ?? "0", 
      icon: Package, 
      color: "text-indigo-600",
      bg: "bg-indigo-50" 
    },
    { 
      label: "Total Orders", 
      value: stats?.totalOrders ?? "0", 
      icon: ShoppingBag, 
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "+12.5%" 
    },
    { 
      label: "Customers", 
      value: stats?.totalCustomers ?? "0", 
      icon: Users, 
      color: "text-blue-600",
      bg: "bg-blue-50" 
    },
    {
      label: "Gross Revenue",
      value: hideRevenue && stats ? "••••••" : stats ? formatPrice(stats.totalRevenue || 0) : "₹0",
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
      isRevenue: true
    }
  ];

  if (status.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium anim-pulse">Synchronizing studio data...</p>
      </div>
    );
  }

  return (
    <div className="page-stack admin-animate">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Studio Analytics</h1>
          <p className="text-slate-500 mt-1">Monitor your store performance and inventory in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-outline flex items-center gap-2"
            onClick={() => setHideRevenue((v) => !v)}
          >
            {hideRevenue ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{hideRevenue ? "Show Values" : "Hide Values"}</span>
          </button>
          <Link to="/admin/products/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>New Product</span>
          </Link>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}

      <div className="admin-card-grid">
        {statsCards.map((card) => (
          <div key={card.label} className="admin-card group transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color} transition-colors group-hover:bg-opacity-80`}>
                <card.icon size={24} />
              </div>
              {card.trend && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  {card.trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="admin-card-label font-bold tracking-wider">{card.label}</p>
              <h3 className="admin-card-value">{card.value}</h3>
            </div>
            {card.isRevenue && (
              <div className="mt-4 h-12 flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <Sparkline color="#8b5cf6" />
              </div>
            )}
            {!card.isRevenue && (
              <div className="mt-4 h-12 flex items-end gap-1 opacity-20">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex-1 bg-slate-300 rounded-t-sm" style={{ height: `${20 + Math.random() * 80}%` }}></div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="panel flex flex-col h-full bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
              <p className="text-sm text-slate-500">Processing latest customer requests</p>
            </div>
            <Link to="/admin/orders" className="text-indigo-600 text-sm font-semibold flex items-center hover:underline">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex-1 p-2">
            {(stats?.recentOrders || []).length ? (
              <div className="space-y-1">
                {stats.recentOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    to={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase group-hover:bg-white group-hover:shadow-sm">
                        #{order.id.toString().slice(-2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Order #{order.id}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[140px] md:max-w-xs">{order.user?.email || "Guest Checkout"}</p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                               <span className="text-[10px] font-bold text-slate-700 truncate max-w-[80px]" title={item.product?.title}>
                                 {item.product?.title || "Item"}
                               </span>
                               {item.size && (
                                 <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-widest border border-indigo-100/50">
                                   {item.size}
                                 </span>
                               )}
                               <span className="text-[10px] font-bold text-slate-400">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-slate-900">{formatPrice(order.totalAmount)}</span>
                      <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full">
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <ShoppingBag size={48} strokeWidth={1} className="mb-3 opacity-20" />
                <p>No orders recorded yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="panel flex flex-col h-full bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Quick Operations</h2>
            <p className="text-sm text-slate-500">Shortcut tasks for studio management</p>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <QuickActionCard 
              to="/admin/products" 
              title="Catalog" 
              desc="Manage items" 
              icon={Package} 
              color="bg-orange-50 text-orange-600" 
            />
            <QuickActionCard 
              to="/admin/categories" 
              title="Taxonomy" 
              desc="Organize tags" 
              icon={List} 
              color="bg-blue-50 text-blue-600" 
            />
            <QuickActionCard 
              to="/admin/hero" 
              title="Showcase" 
              desc="Hero slides" 
              icon={TrendingUp} 
              color="bg-pink-50 text-pink-600" 
            />
            <QuickActionCard 
              to="/admin/customers" 
              title="Accounts" 
              desc="User profiles" 
              icon={Users} 
              color="bg-emerald-50 text-emerald-600" 
            />
          </div>
          <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">System Health: Optimal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="panel bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              <h2 className="text-lg font-bold text-slate-900">Inventory Alerts</h2>
            </div>
            <Link to="/admin/products" className="text-slate-500 hover:text-indigo-600 transition-colors">
              <PlusCircle size={20} />
            </Link>
          </div>
          <div className="p-6">
            {lowStock.length ? (
              <div className="space-y-4">
                {lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer">{product.title}</p>
                        <p className="text-xs text-slate-500">Current Stock: <span className="text-orange-600 font-bold">{product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0}</span></p>
                      </div>
                    </div>
                    <Link to={`/admin/products/${product.id}`} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                      <ArrowRight size={18} className="text-slate-400" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-emerald-500 opacity-60">
                <Package size={48} strokeWidth={1} className="mb-3" />
                <p className="font-bold">Inventory levels are healthy</p>
              </div>
            )}
          </div>
        </div>

        <div className="panel bg-indigo-600 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-indigo-100 flex flex-col justify-center">
          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-bold uppercase tracking-[0.2em] mb-2">Studio Tip</p>
            <h2 className="text-2xl font-black text-white leading-tight mb-4">Improve Sales with New Hero Stories</h2>
            <p className="text-indigo-100/80 mb-6 max-w-xs">Dynamic homepage slides can increase click-through rates by up to 15%. refresh your visual marketing today.</p>
            <Link to="/admin/hero" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-colors group">
              Manage Hero <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute right-10 top-10 text-white/10">
            <TrendingUp size={160} strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ to, title, desc, icon: Icon, color }) {
  return (
    <Link to={to} className="flex flex-col gap-3 p-5 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 group transition-all">
      <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{desc}</p>
      </div>
    </Link>
  );
}

function Sparkline({ color }) {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path
        d="M0 35 Q 10 25, 20 30 T 40 10 T 60 20 T 80 5 T 100 15"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
