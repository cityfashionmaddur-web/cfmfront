import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminGet } from "../../utils/adminApi.js";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus({ loading: true, error: "" });
      try {
        const data = await adminGet("/admin/customers");
        if (!active) return;
        setCustomers(data || []);
      } catch (err) {
        if (!active) return;
        setStatus({ loading: false, error: err.message || "Failed to load customers." });
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Customers</h1>
          <p>View registered shoppers, their profiles, and order history.</p>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.length ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/70 transition">
                    <td>{customer.name || "-"}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.role || "CUSTOMER"}</td>
                    <td>
                      <Link className="btn btn-outline transition hover:-translate-y-0.5" to={`/admin/customers/${customer.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    No customers found.
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
