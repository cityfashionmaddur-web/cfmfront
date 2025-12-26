import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminDelete, adminGet, adminPut } from "../../utils/adminApi.js";

export default function AdminCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });
  const [status, setStatus] = useState({ loading: false, error: "", saving: false, deleting: false, success: "" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatus((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const data = await adminGet(`/admin/categories/${id}`);
        if (!active) return;
        setForm({ name: data.name || "", description: data.description || "" });
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load category." }));
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      await adminPut(`/admin/categories/${id}`, {
        name: form.name.trim(),
        description: form.description.trim() || undefined
      });
      setStatus((prev) => ({ ...prev, success: "Category updated." }));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to save category." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this category?")) return;
    setStatus((prev) => ({ ...prev, deleting: true, error: "" }));
    try {
      await adminDelete(`/admin/categories/${id}`);
      navigate("/admin/categories");
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to delete category." }));
    } finally {
      setStatus((prev) => ({ ...prev, deleting: false }));
    }
  };

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Category #{id}</h1>
          <p>Edit category details.</p>
        </div>
        <Link className="link" to="/admin/categories">
          Back to categories
        </Link>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.success && <div className="success">{status.success}</div>}
      {status.loading ? (
        <div className="loading">Loading category...</div>
      ) : (
        <form className="panel admin-form admin-animate" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <textarea
              className="input"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="admin-inline">
            <button className="btn btn-primary" type="submit" disabled={status.saving}>
              {status.saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleDelete}
              disabled={status.deleting}
            >
              {status.deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
