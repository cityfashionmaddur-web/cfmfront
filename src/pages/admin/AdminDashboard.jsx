
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminGet } from "../../utils/adminApi.js";
import { formatPrice } from "../../utils/format.js";

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
    () => products.filter((item) => (item.stock ?? 0) <= 5).slice(0, 5),
    [products]
  );

  const heroPreview = useMemo(() => slides.slice(0, 3), [slides]);

  const cards = [
    { label: "Products", value: stats?.totalProducts ?? "-" },
    { label: "Orders", value: stats?.totalOrders ?? "-" },
    { label: "Customers", value: stats?.totalCustomers ?? "-" },
    {
      label: "Revenue",
      value:
        hideRevenue && stats
          ? "••••••"
          : stats
          ? formatPrice(stats.totalRevenue || 0)
          : "-"
    },
    { label: "Pending", value: stats?.pendingOrders ?? "-" }
  ];

  return (
    <div className="page-stack">
      <section className="section-header items-start flex-wrap gap-3 mb-3">
        <div className="space-y-1">
          <h1>Admin Dashboard</h1>
          <p className="text-sm text-slate-600 pb-2">Realtime operations overview from the ecommerce API.</p>
        </div>
        <div className="panel-actions gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setHideRevenue((v) => !v)}
          >
            {hideRevenue ? "Show revenue" : "Hide revenue"}
          </button>
          <Link className="btn btn-outline transition hover:-translate-y-0.5" to="/">
            View storefront
          </Link>
          <Link className="btn btn-primary transition hover:-translate-y-0.5" to="/admin/orders">
            Review orders
          </Link>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : (
        <>
          <div className="admin-card-grid">
            {cards.map((card) => (
              <div
                key={card.label}
                className="admin-card admin-animate transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="admin-card-label">{card.label}</p>
                <p className="admin-card-value">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="admin-grid">
            <div className="panel admin-animate transition hover:-translate-y-1 hover:shadow-lg">
              <div className="admin-section-header mb-3">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Last 5 orders and their customers.</p>
                </div>
                <Link className="link" to="/admin/orders">
                  View all
                </Link>
              </div>
              {(stats?.recentOrders || []).length ? (
                <div className="admin-list">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="admin-list-row hover:bg-slate-50/70">
                      <div>
                        <p className="admin-list-title">Order #{order.id}</p>
                        <p className="admin-list-meta">{order.user?.email || "Guest checkout"}</p>
                      </div>
                      <Link className="btn btn-outline transition hover:-translate-y-0.5" to={`/admin/orders/${order.id}`}>
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="helper">No orders yet.</p>
              )}
            </div>

            <div className="panel admin-animate transition hover:-translate-y-1 hover:shadow-lg">
              <div className="admin-section-header mb-3">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Jump straight to editing.</p>
                </div>
              </div>
              <div className="admin-quick-grid">
                <QuickLink to="/admin/products" title="Products" description="Add or update catalog." />
                <QuickLink to="/admin/categories" title="Categories" description="Group and organize." />
                <QuickLink to="/admin/hero" title="Hero Slides" description="Refresh homepage stories." />
                <QuickLink to="/admin/customers" title="Customers" description="Review shopper profiles." />
              </div>
            </div>
          </div>

          <div className="admin-grid">
            <div className="panel admin-animate transition hover:-translate-y-1 hover:shadow-lg">
              <div className="admin-section-header mb-3">
                <div>
                  <h2>Hero Slides</h2>
                  <p>Top carousel snapshots.</p>
                </div>
                <Link className="link" to="/admin/hero">
                  Manage slides
                </Link>
              </div>
              {heroPreview.length ? (
                <div className="admin-mini-grid">
                  {heroPreview.map((slide) => (
                    <div key={slide.id} className="admin-mini-card hover:border-slate-300">
                      <p className="admin-mini-label">{slide.badge || "Slide"}</p>
                      <p className="admin-mini-title">{slide.title}</p>
                      <p className="admin-mini-meta">{slide.active ? "Active" : "Inactive"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="helper">No slides configured.</p>
              )}
            </div>

            <div className="panel admin-animate transition hover:-translate-y-1 hover:shadow-lg">
              <div className="admin-section-header mb-3">
                <div>
                  <h2>Low Stock</h2>
                  <p>Items to replenish soon.</p>
                </div>
                <Link className="link" to="/admin/products">
                  View all
                </Link>
              </div>
              {lowStock.length ? (
                <div className="admin-list">
                  {lowStock.map((product) => (
                    <div key={product.id} className="admin-list-row hover:bg-slate-50/70">
                      <div>
                        <p className="admin-list-title">{product.title}</p>
                        <p className="admin-list-meta">{formatPrice(product.price)}</p>
                      </div>
                      <span className="admin-pill">Stock: {product.stock ?? 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="helper">All products are well stocked.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ to, title, description }) {
  return (
    <Link className="admin-quick-card" to={to}>
      <div>
        <p className="admin-quick-title">{title}</p>
        <p className="admin-quick-meta">{description}</p>
      </div>
      <span className="admin-quick-arrow">&gt;</span>
    </Link>
  );
}
