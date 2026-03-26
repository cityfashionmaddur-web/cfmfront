import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDelete, adminGet, adminPost } from "../../utils/adminApi.js";
import { Plus, Edit, Trash2, Layers, Search } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [status, setStatus] = useState({ loading: false, error: "", saving: false });
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-6 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Categories</h1>
          <p className="text-slate-500 mt-1">Structure your storefront taxonomy.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter categories..." 
              className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form className="panel flex flex-col gap-5 bg-white shadow-sm border border-slate-200 rounded-3xl p-6" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-xl font-black text-slate-900">Create New</h2>
              <p className="text-sm text-slate-500">Define a new product group</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Label Name</label>
                <input 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800"
                  placeholder="e.g., Casual Wear"
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-600 resize-none"
                  placeholder="Describe the purpose..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <button className="btn btn-primary w-full py-4 rounded-2xl shadow-lg shadow-indigo-100" type="submit" disabled={status.saving}>
              {status.saving ? (
                 <div className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus size={18} />
                  <span>Register Category</span>
                </div>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {status.loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
               <p className="text-slate-500 font-medium tracking-tight">Accessing taxonomy...</p>
             </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>System Slug</th>
                    <th>Linked Products</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length ? (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <Layers size={14} strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-slate-800">{cat.name}</span>
                          </div>
                        </td>
                        <td>
                          <code className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[11px] font-bold">/{cat.slug}</code>
                        </td>
                        <td>
                          <span className="font-black text-slate-700">{cat._count?.products ?? 0}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase ml-1 tracking-tighter">Items</span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <Link className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100" to={`/admin/categories/${cat.id}`}>
                              <Edit size={16} />
                            </Link>
                            <button 
                              className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all border border-transparent hover:border-red-100" 
                              type="button" 
                              onClick={() => handleDelete(cat.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <Layers size={48} strokeWidth={1} className="mb-4 opacity-20" />
                          <p className="font-medium text-slate-500">No categories organized</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
