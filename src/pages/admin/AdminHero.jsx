import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDelete, adminGet } from "../../utils/adminApi.js";
import { Plus, Edit, Trash2, Image as ImageIcon, Activity } from "lucide-react";

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
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-6 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hero Slides</h1>
          <p className="text-slate-500 mt-1">Design the top of your homepage showcase.</p>
        </div>
        <Link className="btn btn-primary shadow-lg shadow-indigo-100" to="/admin/hero/new">
          <Plus size={18} />
          <span>Add Slide</span>
        </Link>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      {status.loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium tracking-tight">Accessing storefront carousel...</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-[240px]">Visual Impression</th>
                <th>Content Details</th>
                <th>Visibility</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.length ? (
                slides.map((slide) => (
                  <tr key={slide.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td>
                      <div className="h-28 w-48 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm relative group">
                        {slide.image ? (
                          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
                            <ImageIcon size={24} strokeWidth={1} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Missing Asset</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <p className="font-black text-slate-900 leading-tight">{slide.title}</p>
                        <p className="text-sm text-slate-500 font-medium">{slide.subtitle || "No description provided"}</p>
                        {slide.badge && (
                          <span className="self-start mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded">
                            {slide.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${slide.active ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${slide.active ? "text-emerald-600" : "text-slate-400"}`}>
                          {slide.active ? "Live on Store" : "Hidden"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link className="p-3 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm" to={`/admin/hero/${slide.id}`}>
                          <Edit size={18} />
                        </Link>
                        <button
                          className="p-3 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                          type="button"
                          onClick={() => handleDelete(slide.id)}
                          disabled={status.deleting === slide.id}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-medium text-slate-500">No slides configured for the showcase</p>
                    </div>
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
