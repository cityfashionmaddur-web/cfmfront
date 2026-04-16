import React, { useEffect, useState } from "react";
import { adminDelete, adminGet, adminPost, adminPut } from "../../utils/adminApi.js";
import { Plus, Trash2, Edit, FolderOpen, Save, X, ChevronDown, ChevronUp, GripVertical } from "lucide-react";

export default function AdminCollections() {
  const [collections, setCollections] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", saving: false });
  const [form, setForm] = useState({ name: "", sortOrder: 0, showInNav: true, categoryIds: [] });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setStatus((p) => ({ ...p, loading: true, error: "" }));
    try {
      const [cols, cats] = await Promise.all([
        adminGet("/admin/collections"),
        adminGet("/admin/categories")
      ]);
      setCollections(cols || []);
      setAllCategories(cats || []);
    } catch (err) {
      setStatus((p) => ({ ...p, error: err.message || "Load failed" }));
    } finally {
      setStatus((p) => ({ ...p, loading: false }));
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", sortOrder: 0, showInNav: true, categoryIds: [] });
    setEditingId(null);
  };

  const startEdit = (col) => {
    setEditingId(col.id);
    setForm({
      name: col.name,
      sortOrder: col.sortOrder || 0,
      showInNav: col.showInNav !== false,
      categoryIds: col.categories?.map((c) => c.id) || []
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setStatus((p) => ({ ...p, error: "Collection name is required." }));
      return;
    }
    setStatus((p) => ({ ...p, saving: true, error: "" }));
    try {
      if (editingId) {
        await adminPut(`/admin/collections/${editingId}`, form);
      } else {
        await adminPost("/admin/collections", form);
      }
      resetForm();
      await load();
    } catch (err) {
      setStatus((p) => ({ ...p, error: err.message || "Save failed" }));
    } finally {
      setStatus((p) => ({ ...p, saving: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this collection? Categories will be unlinked but not deleted.")) return;
    try {
      await adminDelete(`/admin/collections/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setStatus((p) => ({ ...p, error: err.message || "Delete failed" }));
    }
  };

  const toggleCategory = (catId) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId]
    }));
  };

  // Categories NOT in any collection or in THIS collection
  const availableCategories = allCategories.filter((cat) => {
    const inOtherCollection = collections.some(
      (col) => col.id !== editingId && col.categories?.some((c) => c.id === cat.id)
    );
    return !inOtherCollection;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Collections</h1>
          <p className="text-slate-400 text-sm font-bold mt-1">Group categories together for navbar display</p>
        </div>
      </div>

      {status.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-2xl text-sm font-bold">
          {status.error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <FolderOpen className="text-indigo-500" size={20} />
          <h2 className="text-lg font-black text-slate-900">
            {editingId ? "Edit Collection" : "Create Collection"}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Name</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800"
              placeholder="e.g. Topwear"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sort Order</label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800"
              value={form.sortOrder}
              onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2 flex items-end">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`h-6 w-11 rounded-full relative transition-all duration-300 ${form.showInNav ? "bg-indigo-600" : "bg-slate-200"}`}>
                <div className={`h-4 w-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${form.showInNav ? "left-6" : "left-1"}`}></div>
              </div>
              <input type="checkbox" className="hidden" checked={form.showInNav} onChange={(e) => setForm((p) => ({ ...p, showInNav: e.target.checked }))} />
              <span className="text-sm font-black text-slate-600">Show in Navbar</span>
            </label>
          </div>
        </div>

        {/* Category Assignment */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assign Categories</label>
          {availableCategories.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium">No categories available. Create categories first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => {
                const selected = form.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all duration-200 ${
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={status.saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {status.saving ? "Saving..." : editingId ? "Update Collection" : "Create Collection"}
        </button>
      </form>

      {/* Collections List */}
      {status.loading ? (
        <div className="text-center py-12 text-slate-400 font-bold">Loading...</div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-bold">No collections yet. Create one above.</div>
      ) : (
        <div className="space-y-4">
          {collections.map((col) => (
            <div key={col.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-900">{col.name}</h3>
                  {col.showInNav && (
                    <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                      In Navbar
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Sort: {col.sortOrder}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {col.categories?.length > 0 ? (
                    col.categories.map((cat) => (
                      <span key={cat.id} className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                        {cat.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No categories assigned</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEdit(col)}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(col.id)}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
