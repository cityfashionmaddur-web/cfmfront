import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDelete, adminGet, adminPost } from "../../utils/adminApi.js";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [status, setStatus] = useState({ loading: false, error: "", saving: false });

  const load = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await adminGet("/admin/categories");
      setCategories(data || []);
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to load categories." }));
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus((prev) => ({ ...prev, error: "Category name is required." }));
      return;
    }
    setStatus((prev) => ({ ...prev, saving: true, error: "" }));
    try {
      await adminPost("/admin/categories", {
        name: form.name.trim(),
        description: form.description.trim() || undefined
      });
      setForm({ name: "", description: "" });
      await load();
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to create category." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    setStatus((prev) => ({ ...prev, error: "" }));
    try {
      await adminDelete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to delete category." }));
    }
  };

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Categories</h1>
          <p>Organize your product catalog.</p>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}

      <form className="panel admin-form admin-animate" onSubmit={handleSubmit}>
        <div className="admin-section-header">
          <div>
            <h2>Create category</h2>
            <p>Add a new category for products.</p>
          </div>
        </div>
        <div className="admin-form-grid mt-2">
          <label className="admin-field">
            <span>Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={status.saving}>
          {status.saving ? "Creating..." : "Create category"}
        </button>
      </form>

      {status.loading ? (
        <div className="loading">Loading categories...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length ? (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td>{cat.slug}</td>
                    <td>{cat._count?.products ?? 0}</td>
                    <td>
                      <div className="admin-inline">
                        <Link className="btn btn-outline" to={`/admin/categories/${cat.id}`}>
                          Edit
                        </Link>
                        <button className="btn btn-ghost" type="button" onClick={() => handleDelete(cat.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    No categories found.
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
