import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDelete, adminGet } from "../../utils/adminApi.js";

export default function AdminHero() {
  const [slides, setSlides] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", deleting: null });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus({ loading: true, error: "", deleting: null });
      try {
        const data = await adminGet("/admin/hero");
        if (!active) return;
        setSlides(data || []);
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load slides." }));
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
    if (!confirm("Delete this slide?")) return;
    setStatus((prev) => ({ ...prev, deleting: id, error: "" }));
    try {
      await adminDelete(`/admin/hero/${id}`);
      setSlides((prev) => prev.filter((slide) => slide.id !== id));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to delete slide." }));
    } finally {
      setStatus((prev) => ({ ...prev, deleting: null }));
    }
  };

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>Hero Slides</h1>
          <p>Manage the homepage carousel content.</p>
        </div>
        <div className="m-4">
        <Link className="btn btn-primary" to="/admin/hero/new">
          Add slide
        </Link>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="loading">Loading slides...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Content</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {slides.length ? (
                slides.map((slide) => (
                  <tr key={slide.id}>
                    <td>
                      <div className="admin-thumb admin-thumb-lg">
                        {slide.image ? <img src={slide.image} alt={slide.title} /> : <span>No image</span>}
                      </div>
                    </td>
                    <td>
                      <p className="admin-list-title">{slide.title}</p>
                      <p className="admin-list-meta">{slide.subtitle || "-"}</p>
                      {slide.badge && <span className="admin-pill">{slide.badge}</span>}
                    </td>
                    <td>
                      <span className={`admin-pill ${slide.active ? "admin-pill-active" : ""}`}>
                        {slide.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline">
                        <Link className="btn btn-outline" to={`/admin/hero/${slide.id}`}>
                          Edit
                        </Link>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() => handleDelete(slide.id)}
                          disabled={status.deleting === slide.id}
                        >
                          {status.deleting === slide.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    No hero slides yet.
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
