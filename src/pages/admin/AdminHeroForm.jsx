import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminGet, adminPost, adminPut, uploadProductImage } from "../../utils/adminApi.js";

const emptyForm = {
  title: "",
  subtitle: "",
  badge: "",
  caption: "",
  cta1Label: "",
  cta1Href: "",
  cta2Label: "",
  cta2Href: "",
  tags: "",
  image: "",
  active: true,
  sortOrder: 0
};

export default function AdminHeroForm({ mode = "edit" }) {
  const { id } = useParams();
  const isEdit = mode !== "create";
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ loading: false, saving: false, uploading: false, error: "" });

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    const load = async () => {
      setStatus((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const data = await adminGet(`/admin/hero/${id}`);
        if (!active) return;
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          badge: data.badge || "",
          caption: data.caption || "",
          cta1Label: data.cta1Label || "",
          cta1Href: data.cta1Href || "",
          cta2Label: data.cta2Label || "",
          cta2Href: data.cta2Href || "",
          tags: data.tags || "",
          image: data.image || "",
          active: data.active ?? true,
          sortOrder: data.sortOrder ?? 0
        });
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load slide." }));
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const updateField = (field) => (event) => {
    const value = field === "active" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus((prev) => ({ ...prev, uploading: true, error: "" }));
    try {
      const url = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Upload failed." }));
    } finally {
      setStatus((prev) => ({ ...prev, uploading: false }));
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.image.trim()) {
      setStatus((prev) => ({ ...prev, error: "Title and image are required." }));
      return;
    }
    setStatus((prev) => ({ ...prev, saving: true, error: "" }));

    const payload = {
      ...form,
      title: form.title.trim(),
      image: form.image.trim(),
      sortOrder: Number(form.sortOrder) || 0
    };

    try {
      if (isEdit) {
        await adminPut(`/admin/hero/${id}`, payload);
      } else {
        await adminPost("/admin/hero", payload);
      }
      navigate("/admin/hero");
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to save slide." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>{isEdit ? `Edit Slide #${id}` : "Add Hero Slide"}</h1>
          <p>{isEdit ? "Update carousel visuals." : "Create a new hero story."}</p>
        </div>
        <Link className="link" to="/admin/hero">
          Back to slides
        </Link>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="loading">Loading slide...</div>
      ) : (
        <div className="admin-grid">
          <form className="panel admin-form admin-animate" onSubmit={handleSubmit}>
            <label className="admin-field">
              <span>Title *</span>
              <input className="input" value={form.title} onChange={updateField("title")} required />
            </label>
            <label className="admin-field">
              <span>Subtitle</span>
              <input className="input" value={form.subtitle} onChange={updateField("subtitle")} />
            </label>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Badge</span>
                <input className="input" value={form.badge} onChange={updateField("badge")} />
              </label>
              <label className="admin-field">
                <span>Caption</span>
                <input className="input" value={form.caption} onChange={updateField("caption")} />
              </label>
            </div>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Primary CTA Label</span>
                <input className="input" value={form.cta1Label} onChange={updateField("cta1Label")} />
              </label>
              <label className="admin-field">
                <span>Primary CTA Link</span>
                <input className="input" value={form.cta1Href} onChange={updateField("cta1Href")} />
              </label>
            </div>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Secondary CTA Label</span>
                <input className="input" value={form.cta2Label} onChange={updateField("cta2Label")} />
              </label>
              <label className="admin-field">
                <span>Secondary CTA Link</span>
                <input className="input" value={form.cta2Href} onChange={updateField("cta2Href")} />
              </label>
            </div>
            <label className="admin-field">
              <span>Tags</span>
              <input className="input" value={form.tags} onChange={updateField("tags")} />
            </label>

            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Image URL *</span>
                <input className="input" value={form.image} onChange={updateField("image")} required />
              </label>
              <div className="admin-upload panel">
                <div className="admin-section-header">
                  <div>
                    <h3>Upload image</h3>
                    <p>Use an image from your bucket.</p>
                  </div>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status.uploading}
                  >
                    {status.uploading ? "Uploading..." : "Choose file"}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  className="admin-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="admin-form-grid">
              <label className="admin-field admin-toggle">
                <input type="checkbox" checked={form.active} onChange={updateField("active")} />
                <span>Active</span>
              </label>
              <label className="admin-field">
                <span>Sort order</span>
                <input
                  className="input"
                  type="number"
                  value={form.sortOrder}
                  onChange={updateField("sortOrder")}
                />
              </label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={status.saving}>
              {status.saving ? "Saving..." : "Save slide"}
            </button>
          </form>

          <div className="panel admin-animate">
            <div className="admin-section-header">
              <div>
                <h2>Preview</h2>
                <p>How the slide will look.</p>
              </div>
            </div>
            <div className="admin-hero-preview">
              {form.image ? <img src={form.image} alt="Hero preview" /> : <span>No image yet</span>}
              <div className="admin-hero-overlay">
                {form.badge && <span className="admin-hero-badge">{form.badge}</span>}
                <h3>{form.title || "Slide title"}</h3>
                <p>{form.subtitle || "Subtitle"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
