import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminGet } from "../../utils/adminApi.js";
import { formatDate } from "../../utils/format.js";

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

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Customer #{id}</h1>
          <p>Profile details and contact info.</p>
        </div>
        <Link className="link" to="/admin/customers">
          Back to customers
        </Link>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="loading">Loading customer...</div>
      ) : customer ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel admin-animate admin-summary transition hover:-translate-y-1 hover:shadow-lg">
            <div className="admin-summary-row">
              <span>Name</span>
              <span>{customer.name || "-"}</span>
            </div>
            <div className="admin-summary-row">
              <span>Email</span>
              <span>{customer.email || "-"}</span>
            </div>
            <div className="admin-summary-row">
              <span>Role</span>
              <span>{customer.role || "CUSTOMER"}</span>
            </div>
            <div className="admin-summary-row">
              <span>Joined</span>
              <span>{formatDate(customer.createdAt)}</span>
            </div>
            <div className="admin-address">
              <h3>Shipping address</h3>
              <p>{customer.addressLine1 || "-"}</p>
              {customer.addressLine2 && <p>{customer.addressLine2}</p>}
              <p>{[customer.city, customer.state, customer.postalCode].filter(Boolean).join(", ")}</p>
              <p>{customer.country}</p>
              <p>{customer.phone}</p>
            </div>
          </div>

          <div className="panel admin-animate transition hover:-translate-y-1 hover:shadow-lg">
            <div className="admin-section-header">
              <div>
                <h2>Orders</h2>
                <p>Recent orders from this customer.</p>
              </div>
              <Link className="link" to="/admin/orders">All orders</Link>
            </div>
            {orders.length ? (
              <div className="admin-list">
                {orders.map((order) => (
                  <div key={order.id} className="admin-list-row hover:bg-slate-50/70">
                    <div>
                      <p className="admin-list-title">Order #{order.id}</p>
                      <p className="admin-list-meta">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`admin-pill ${order.status === "PAID" ? "admin-pill-active" : ""}`}
                      >
                        {order.status}
                      </span>
                      <Link className="btn btn-outline transition hover:-translate-y-0.5" to={`/admin/orders/${order.id}`}>
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper">No orders yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">Customer not found.</div>
      )}
    </div>
  );
}
