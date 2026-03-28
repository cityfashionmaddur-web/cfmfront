import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminGet } from "../../utils/adminApi.js";
import { Users, Search, Eye, ShieldCheck, Mail } from "lucide-react";
import useDebounce from "../../hooks/useDebounce.js";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus({ loading: true, error: "" });
      try {
        const data = await adminGet("/admin/customers");
        if (!active) return;
        setCustomers(data || []);
      } catch (err) {
        if (!active) return;
        setStatus({ loading: false, error: err.message || "Failed to load customers." });
      } finally {
        if (active) setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-6 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Review registered shoppers and their loyalty profiles.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-72 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {status.error && <div className="alert">{status.error}</div>}
      
      {status.loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Loading user data...</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile Detail</th>
                <th>Account Email</th>
                <th>Security Role</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 shadow-sm font-bold text-xs uppercase group-hover:bg-white transition-colors">
                          {customer.name?.slice(0, 1) || "?"}
                        </div>
                        <span className="font-bold text-slate-800">{customer.name || "Anonymous Shopper"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Mail size={14} className="opacity-50" />
                        <span>{customer.email || "No email linked"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className={customer.role === "ADMIN" ? "text-indigo-500" : "text-slate-400"} />
                        <span className={`text-[10px] font-black tracking-widest uppercase ${customer.role === "ADMIN" ? "text-indigo-600" : "text-slate-500"}`}>
                          {customer.role || "CUSTOMER"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <Link className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm" to={`/admin/customers/${customer.id}`}>
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Users size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-medium text-lg text-slate-500">No customers located</p>
                      <p className="text-sm">Try broadening your search criteria.</p>
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
