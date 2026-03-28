import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDelete, adminGet } from "../../utils/adminApi.js";
import { formatPrice } from "../../utils/format.js";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import useDebounce from "../../hooks/useDebounce.js";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", deleting: null });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

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

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-6 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">Manage your digital catalog and inventory levels.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link className="btn btn-primary shadow-lg shadow-indigo-100" to="/admin/products/new">
            <Plus size={18} />
            <span>Add Product</span>
          </Link>
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      
      {status.loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Fetching catalog...</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Information</th>
                <th>Category</th>
                <th>Price</th>
                <th>Inventory</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-slate-800">{product.title}</div>
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-600 font-medium px-2 py-1 bg-slate-100 rounded-lg text-xs">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="font-bold text-slate-900">{formatPrice(product.price)}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-700">
                          {product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0} units
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                          {product.variants?.length || 0} Variants
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status ${product.active ? "status-paid" : "status-cancelled"} px-3 py-1 rounded-full text-[10px]`}>
                        {product.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all" to={`/admin/products/${product.id}`}>
                          <Edit size={18} />
                        </Link>
                        <button
                          className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          disabled={status.deleting === product.id}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-medium text-lg text-slate-500">No products discovered</p>
                      <p className="text-sm">Try refining your search or add a new item.</p>
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
