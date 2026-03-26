import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminDelete, adminGet, adminPut } from "../../utils/adminApi.js";
import { 
  ArrowLeft, 
  Tag, 
  AlignLeft, 
  Save, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Hash,
  Info
} from "lucide-react";

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
      setStatus((prev) => ({ ...prev, success: "Category definition updated." }));
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 3000);
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to save category." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this category? This action cannot be undone.")) return;
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

  if (status.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="h-10 w-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-bold tracking-tight uppercase text-[10px] tracking-[0.2em]">Syncing taxonomy...</p>
      </div>
    );
  }

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-8 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/categories" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Manage Category</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Hash size={14} />
              <span>Reference ID: {id}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {status.success && (
             <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-right">
               <CheckCircle2 size={16} />
               <span>{status.success}</span>
             </div>
           )}
           <button 
             className="btn btn-primary px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 font-black text-sm" 
             onClick={handleSubmit}
             disabled={status.saving}
           >
             {status.saving ? (
               <div className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
             ) : (
               <div className="flex items-center gap-2">
                 <Save size={18} />
                 <span>Save Changes</span>
               </div>
             )}
           </button>
        </div>
      </section>

      {status.error && (
        <div className="alert bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-8 flex items-center gap-3">
          <XCircle size={18} />
          <span className="font-bold text-sm">{status.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-12 shadow-sm">
             <div className="max-w-3xl mx-auto space-y-10">
                <div className="flex items-center gap-4 mb-2">
                   <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Tag size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Taxonomy Foundation</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Define identifying traits</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Namespace / Label</label>
                      <input 
                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-lg text-slate-800"
                        placeholder="e.g., Premium Denims"
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 flex items-center gap-2">
                        <AlignLeft size={12} strokeWidth={3} />
                        <span>Scope Description</span>
                      </label>
                      <textarea 
                        rows={6}
                        className="w-full px-6 py-4 rounded-3xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-600 leading-relaxed resize-none"
                        placeholder="Detail the range of products under this taxonomy..."
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      />
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center gap-3 text-slate-400">
                      <Info size={16} />
                      <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        Modifying category names will update all <br /> linked products in real-time.
                      </p>
                   </div>
                   <button 
                     type="button" 
                     className="flex items-center gap-2 text-red-400 hover:text-red-600 font-black text-xs uppercase tracking-[0.15em] transition-colors p-2"
                     onClick={handleDelete}
                     disabled={status.deleting}
                   >
                     <Trash2 size={16} />
                     <span>{status.deleting ? "PURGING DATA..." : "PURGE CATEGORY"}</span>
                   </button>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
