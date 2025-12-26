import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDelete, adminGet } from "../../utils/adminApi.js";
import { formatPrice } from "../../utils/format.js";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", deleting: null });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus({ loading: true, error: "", deleting: null });
      try {
        const data = await adminGet("/admin/products");
        if (!active) return;
        setProducts(data || []);
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load products." }));
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setStatus((prev) => ({ ...prev, deleting: id, error: "" }));
    try {
      await adminDelete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Delete failed." }));
    } finally {
      setStatus((prev) => ({ ...prev, deleting: null }));
    }
  };

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Products</h1>
          <p>Manage your catalog inventory.</p>
        </div>
        <div className="m-4">
  <Link className="btn btn-primary" to="/admin/products/new">
    Add product
  </Link>
</div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.title}</td>
                    <td>{product.category?.name || "-"}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.stock ?? "-"}</td>
                    <td>
                      <span className={`admin-pill ${product.active ? "admin-pill-active" : ""}`}>
                        {product.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline">
                        <Link className="btn btn-outline" to={`/admin/products/${product.id}`}>
                          Edit
                        </Link>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          disabled={status.deleting === product.id}
                        >
                          {status.deleting === product.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No products found.
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
