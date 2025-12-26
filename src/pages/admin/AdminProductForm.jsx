import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminGet, adminPost, adminPut, uploadProductImage } from "../../utils/adminApi.js";

const emptyForm = {
  title: "",
  price: "",
  description: "",
  stock: "",
  images: "",
  categoryId: "",
  active: true
};

export default function AdminProductForm({ mode = "edit" }) {
  const { id } = useParams();
  const isEdit = mode !== "create";
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState({ loading: false, saving: false, error: "", success: "", uploading: false });

  const parsedImages = useMemo(
    () =>
      form.images
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),
    [form.images]
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatus((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const [categoryData, productData] = await Promise.all([
          adminGet("/admin/categories"),
          isEdit ? adminGet(`/admin/products/${id}`) : Promise.resolve(null)
        ]);
        if (!active) return;
        setCategories(categoryData || []);
        if (productData) {
          setForm({
            title: productData.title || "",
            price: productData.price ?? "",
            description: productData.description || "",
            stock: productData.stock ?? "",
            images: (productData.productImages || []).map((img) => img.url).join("\n"),
            categoryId: productData.categoryId || "",
            active: productData.active ?? true
          });
        }
      } catch (err) {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || "Failed to load product." }));
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

  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setStatus((prev) => ({ ...prev, uploading: true, error: "" }));
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadProductImage(file);
        uploaded.push(url);
      }
      if (uploaded.length) {
        setForm((prev) => {
          const existing = prev.images
            .split(/\n|,/)
            .map((value) => value.trim())
            .filter(Boolean);
          return { ...prev, images: [...existing, ...uploaded].join("\n") };
        });
      }
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Upload failed." }));
    } finally {
      setStatus((prev) => ({ ...prev, uploading: false }));
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: "", success: "" }));

    const price = Number(form.price);
    const stock = form.stock === "" ? null : Number(form.stock);
    const images = parsedImages;

    if (!form.title.trim() || Number.isNaN(price)) {
      setStatus((prev) => ({ ...prev, saving: false, error: "Title and price are required." }));
      return;
    }

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price,
      stock: stock ?? 0,
      active: Boolean(form.active),
      categoryId: form.categoryId ? Number(form.categoryId) : undefined
    };

    try {
      if (isEdit) {
        const payload = {
          ...basePayload,
          productImages: {
            deleteMany: {},
            create: images.map((url) => ({ url }))
          }
        };
        await adminPut(`/admin/products/${id}`, payload);
        setStatus((prev) => ({ ...prev, success: "Product updated." }));
      } else {
        await adminPost("/admin/products", { ...basePayload, images });
        setStatus((prev) => ({ ...prev, success: "Product created." }));
      }
      setTimeout(() => navigate("/admin/products"), 600);
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Save failed." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const title = isEdit ? `Edit Product #${id}` : "Add Product";

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <h1>{title}</h1>
          <p>{isEdit ? "Update catalog details." : "Create a new product for the storefront."}</p>
        </div>
        <Link className="link" to="/admin/products">
          Back to products
        </Link>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.success && <div className="success">{status.success}</div>}
      {status.loading ? (
        <div className="loading">Loading product...</div>
      ) : (
        <form className="panel admin-form admin-animate" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Title *</span>
              <input className="input" value={form.title} onChange={updateField("title")} required />
            </label>
            <label className="admin-field">
              <span>Price *</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={updateField("price")}
                required
              />
            </label>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Category</span>
              <select className="input" value={form.categoryId} onChange={updateField("categoryId")}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Stock</span>
              <input
                className="input"
                type="number"
                min="0"
                value={form.stock}
                onChange={updateField("stock")}
              />
            </label>
          </div>

          <label className="admin-field">
            <span>Description</span>
            <textarea className="input" rows={4} value={form.description} onChange={updateField("description")} />
          </label>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Image URLs</span>
              <textarea
                className="input"
                rows={5}
                value={form.images}
                onChange={updateField("images")}
                placeholder="One URL per line"
              />
              <p className="helper">Paste multiple URLs or upload using the panel on the right.</p>
            </label>

            <div className="admin-upload panel">
              <div className="admin-section-header">
                <div>
                  <h3>Upload images</h3>
                  <p>Uploads use signed URLs from the API.</p>
                </div>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={handleFilePick}
                  disabled={status.uploading}
                >
                  {status.uploading ? "Uploading..." : "Select files"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="admin-file-input"
                onChange={handleFileChange}
              />
              {parsedImages.length > 0 ? (
                <div className="admin-thumb-grid">
                  {parsedImages.slice(0, 6).map((url) => (
                    <div key={url} className="admin-thumb">
                      <img src={url} alt="Product" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="helper">No images yet.</p>
              )}
            </div>
          </div>

          <label className="admin-field admin-toggle">
            <input type="checkbox" checked={form.active} onChange={updateField("active")} />
            <span>Active product</span>
          </label>

          <button className="btn btn-primary" type="submit" disabled={status.saving}>
            {status.saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </button>
        </form>
      )}
    </div>
  );
}
