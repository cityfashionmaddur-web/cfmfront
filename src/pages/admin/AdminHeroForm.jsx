import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminGet, adminPost, adminPut, uploadProductImage } from "../../utils/adminApi.js";
import { 
  ArrowLeft, 
  Layout, 
  Sparkles, 
  ImageIcon, 
  Upload, 
  Eye, 
  Save, 
  Type, 
  Link as LinkIcon,
  MousePointer2,
  Settings2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Monitor
} from "lucide-react";

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
  const [status, setStatus] = useState({ loading: false, saving: false, uploading: false, error: "", success: "" });

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
    if (!form.image.trim()) {
      setStatus((prev) => ({ ...prev, error: "An image is required." }));
      return;
    }
    setStatus((prev) => ({ ...prev, saving: true, error: "", success: "" }));

    const payload = {
      ...form,
      image: form.image.trim(),
      sortOrder: Number(form.sortOrder) || 0
    };

    try {
      if (isEdit) {
        await adminPut(`/admin/hero/${id}`, payload);
        setStatus((prev) => ({ ...prev, success: "Hero story updated." }));
      } else {
        await adminPost("/admin/hero", payload);
        setStatus((prev) => ({ ...prev, success: "New hero slide published." }));
      }
      setTimeout(() => navigate("/admin/hero"), 1000);
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Failed to save slide." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  if (status.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="h-12 w-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-bold tracking-tight">Syncing visual assets...</p>
      </div>
    );
  }

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-8 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/hero" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{isEdit ? "Edit Narrative" : "New Hero Story"}</h1>
            <p className="text-slate-500 mt-1">{isEdit ? `Modifying slide #${id.slice(-4)}` : "Design a new flagship carousel entry."}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {status.success && (
             <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
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
                 <span>{isEdit ? "Commit Slide" : "Publish Slide"}</span>
               </div>
             )}
           </button>
        </div>
      </section>

      {status.error && <div className="alert bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-6 font-bold text-sm">{status.error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Content Strategy */}
        <div className="lg:col-span-7 space-y-10">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <MousePointer2 size={18} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-slate-800 tracking-tight">Primary Action (CTA)</h2>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-4">
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-300 transition-all font-bold text-sm" placeholder="Button Label (e.g., EXPLORE COLLECTION)" value={form.cta1Label} onChange={updateField("cta1Label")} />
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-300 transition-all font-mono text-[11px] text-slate-400" placeholder="Link (e.g., /products?sort=newest)" value={form.cta1Href} onChange={updateField("cta1Href")} />
               </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
             <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                 <Settings2 size={18} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-white tracking-tight">Configuration</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 px-1">Display Priority</label>
                  <input 
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-lg outline-none focus:border-indigo-500 transition-all"
                    value={form.sortOrder}
                    onChange={updateField("sortOrder")}
                  />
                  <p className="text-[10px] text-slate-500 font-bold px-1">Lowest values appear first in the carousel.</p>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-4 cursor-pointer group w-full p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                    <div className={`h-8 w-14 rounded-full relative transition-all duration-500 shadow-inner ${form.active ? "bg-indigo-600" : "bg-white/10"}`}>
                      <div className={`h-5 w-5 rounded-full bg-white absolute top-1.5 transition-all duration-500 shadow-lg ${form.active ? "left-7" : "left-2"}`}></div>
                    </div>
                    <div>
                      <span className="block text-sm font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-widest">Visibility status</span>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{form.active ? "Currently Live" : "Draft (Hidden)"}</span>
                    </div>
                    <input type="checkbox" className="hidden" checked={form.active} onChange={updateField("active")} />
                  </label>
                </div>
             </div>
          </section>
        </div>

        {/* Right Column: Visual Strategy & Preview */}
        <div className="lg:col-span-5 space-y-10">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <ImageIcon size={18} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight">Visual Asset</h2>
               </div>
               
               <button 
                 type="button" 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={status.uploading}
                 className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all"
               >
                 {status.uploading ? (
                   <div className="h-5 w-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                 ) : (
                   <Upload size={20} />
                 )}
               </button>
               <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Resource URL</label>
              <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-[11px] text-slate-500" placeholder="https://..." value={form.image} onChange={updateField("image")} required />
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 flex items-center gap-2">
                 <Eye size={12} strokeWidth={3} />
                 <span>High-Fidelity Preview</span>
               </label>
               
               <div className="relative aspect-[16/10] rounded-[2rem] bg-slate-100 border border-slate-200 overflow-hidden group shadow-inner">
                  {form.image ? (
                    <img src={form.image} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={48} strokeWidth={1} className="mb-2 opacity-20" />
                        <p className="text-[10px] font-extrabold uppercase tracking-widest">Awaiting Visual</p>
                    </div>
                  )}
                  
                  {/* Real-time Overlay Simulation */}
                  <div className="absolute inset-0 bg-transparent p-6 flex flex-col items-center justify-end pb-8">
                     <div className="flex gap-2 pt-3">
                        {form.cta1Label && <div className="px-6 py-2 bg-white rounded-lg text-[9px] font-black text-black uppercase tracking-widest shadow-xl">{form.cta1Label}</div>}
                     </div>
                  </div>
                  
                  <div className="absolute top-4 right-4 h-8 w-8 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white/40">
                    <Monitor size={14} />
                  </div>
               </div>
               
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-1">
                 This preview simulates the homepage hero slider. Text colors and alignment are adjusted automatically based on container logic.
               </p>
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2.5rem] p-8 text-white shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <Sparkles size={20} className="text-indigo-400" />
                <h3 className="text-lg font-black tracking-tight">Curation Strategy</h3>
             </div>
             <ul className="space-y-4">
                {[
                  "Use aspect ratios optimized for mobile and desktop.",
                  "Headlines should be punchy (3-6 words maximum).",
                  "Call-to-actions should create a sense of urgency.",
                  "High contrast backgrounds improve readability."
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs font-bold text-slate-400 leading-relaxed">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                    <span>{tip}</span>
                  </li>
                ))}
             </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
