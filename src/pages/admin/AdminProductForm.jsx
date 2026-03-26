import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminGet, adminPost, adminPut, uploadProductImage } from "../../utils/adminApi.js";
import { 
  ArrowLeft, 
  Package, 
  Sparkles, 
  Upload, 
  Trash2, 
  Plus, 
  Info, 
  CheckCircle2, 
  XCircle,
  ImageIcon,
  LayoutGrid,
  ChevronDown
} from "lucide-react";

const emptyForm = {
  title: "",
  price: "",
  description: "",
  variants: [],
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
            variants: productData.variants || [],
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

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { size: "", stock: 0 }] }));
  };

  const updateVariant = (index, field, value) => {
    setForm((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariant = (index) => {
    setForm((prev) => {
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };

  const fillPattern = (pattern) => {
    let sizes = [];
    if (pattern === "letters") sizes = ["S", "M", "L", "XL", "XXL", "3XL"];
    if (pattern === "waist") sizes = ["28", "30", "32", "34", "36", "38", "40"];
    if (pattern === "large") sizes = ["50", "55", "60", "65", "70", "75", "80"];
    
    setForm((prev) => ({
      ...prev,
      variants: sizes.map((size) => ({ size, stock: 0 }))
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: "", success: "" }));

    const price = Number(form.price);
    const images = parsedImages;

    if (!form.title.trim() || Number.isNaN(price)) {
      setStatus((prev) => ({ ...prev, saving: false, error: "Title and price are required." }));
      return;
    }

    if (form.variants.some(v => !v.size.trim())) {
      setStatus((prev) => ({ ...prev, saving: false, error: "All size variants must have a name." }));
      return;
    }

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price,
      variants: form.variants,
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
        setStatus((prev) => ({ ...prev, success: "Product updated successfully." }));
      } else {
        await adminPost("/admin/products", { ...basePayload, images });
        setStatus((prev) => ({ ...prev, success: "New product listed." }));
      }
      setTimeout(() => navigate("/admin/products"), 1000);
    } catch (err) {
      setStatus((prev) => ({ ...prev, error: err.message || "Save failed." }));
    } finally {
      setStatus((prev) => ({ ...prev, saving: false }));
    }
  };

  const titleText = isEdit ? `Listing #${id.toString().slice(-4)}` : "New Listing";

  if (status.loading) {
     return (
       <div className="flex flex-col items-center justify-center py-40">
         <div className="relative">
           <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <Package size={24} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
         </div>
         <p className="mt-6 text-slate-500 font-bold tracking-tight">Syncing catalog data...</p>
       </div>
     );
  }

  return (
    <div className="page-stack admin-animate">
      <section className="section-header border-b border-slate-100 pb-8 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/products" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{titleText}</h1>
            <p className="text-slate-500 mt-1">{form.title || (isEdit ? "Loading product..." : "Start by defining the basics.")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {status.success && (
             <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-right duration-500">
               <CheckCircle2 size={16} />
               <span>{status.success}</span>
             </div>
           )}
           <button 
             className="btn btn-primary px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all font-black text-sm" 
             onClick={handleSubmit}
             disabled={status.saving}
           >
             {status.saving ? (
               <div className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
             ) : (
               <div className="flex items-center gap-2">
                 <Sparkles size={18} />
                 <span>{isEdit ? "Commit Changes" : "List Product"}</span>
               </div>
             )}
           </button>
        </div>
      </section>

      {status.error && (
        <div className="alert flex items-start gap-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl p-4 mb-6">
          <XCircle size={18} className="mt-0.5" />
          <div className="text-sm font-bold">{status.error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Core Data */}
        <div className="lg:col-span-7 space-y-10">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <Info size={18} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-slate-800 tracking-tight">Product Foundation</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Display Title</label>
                <input 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg text-slate-800"
                  placeholder="e.g., Premium Vintage Hoodie"
                  value={form.title} 
                  onChange={updateField("title")} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">System Price</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                    <input 
                      type="number"
                      className="w-full pl-10 pr-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800"
                      placeholder="0.00"
                      value={form.price} 
                      onChange={updateField("price")} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Taxonomy Class</label>
                  <div className="relative">
                    <select 
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 appearance-none bg-white"
                      value={form.categoryId} 
                      onChange={updateField("categoryId")}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Story & Details</label>
                <textarea 
                  rows={8}
                  className="w-full px-6 py-4 rounded-3xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-600 leading-relaxed resize-none"
                  placeholder="Describe the material, fit, and style..."
                  value={form.description} 
                  onChange={updateField("description")} 
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`h-6 w-11 rounded-full relative transition-all duration-300 ${form.active ? "bg-indigo-600" : "bg-slate-200"}`}>
                    <div className={`h-4 w-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${form.active ? "left-6" : "left-1"}`}></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={form.active} onChange={updateField("active")} />
                  <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors">Visible to public storefront</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-900/10">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                   <LayoutGrid size={18} strokeWidth={2.5} />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-white tracking-tight">Stock Logistics</h2>
                   <p className="text-indigo-300/50 text-xs font-bold uppercase tracking-widest mt-0.5">Size-specific inventory management</p>
                 </div>
               </div>
               
               <div className="flex flex-wrap gap-2">
                 <button type="button" onClick={() => fillPattern('letters')} className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">S-3XL</button>
                 <button type="button" onClick={() => fillPattern('waist')} className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">28-40</button>
                 <button type="button" onClick={() => fillPattern('large')} className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">50-80</button>
               </div>
             </div>

             <div className="space-y-4">
               {form.variants.map((v, i) => (
                 <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                   <div className="flex-1 space-y-2">
                     <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest px-1">Size Tag</label>
                     <input 
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-black text-sm outline-none focus:border-indigo-500 transition-all"
                       placeholder="M, XL, 32..."
                       value={v.size} 
                       onChange={(e) => updateVariant(i, "size", e.target.value)} 
                     />
                   </div>
                   <div className="flex-1 space-y-2">
                     <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest px-1">Units Available</label>
                     <input 
                       type="number"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-black text-sm outline-none focus:border-indigo-500 transition-all"
                       placeholder="0"
                       value={v.stock} 
                       onChange={(e) => updateVariant(i, "stock", Number(e.target.value))} 
                     />
                   </div>
                   <button 
                     type="button" 
                     className="mt-6 p-3 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/5 transition-all"
                     onClick={() => removeVariant(i)}
                   >
                     <Trash2 size={18} />
                   </button>
                 </div>
               ))}

               <button 
                 type="button" 
                 onClick={addVariant}
                 className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest mt-6"
               >
                 <Plus size={16} />
                 <span>Append New Variant</span>
               </button>
             </div>
          </section>
        </div>

        {/* Right Column: Visual Assets */}
        <div className="lg:col-span-5 space-y-10">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <ImageIcon size={18} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight">Gallery</h2>
               </div>
               
               <button 
                 type="button" 
                 onClick={handleFilePick}
                 disabled={status.uploading}
                 className="btn btn-outline border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
               >
                 {status.uploading ? (
                   <div className="h-4 w-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                 ) : (
                   <Upload size={14} />
                 )}
                 <span>{status.uploading ? "Uploading..." : "Import Asset"}</span>
               </button>
               <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
               {parsedImages.map((url, i) => (
                 <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                   <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        type="button" 
                        className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-red-500 hover:text-white transition-all"
                        onClick={() => {
                          setForm(prev => {
                            const lines = prev.images.split(/\n|,/);
                            lines.splice(i, 1);
                            return { ...prev, images: lines.join("\n") };
                          });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                   <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/30 backdrop-blur-md rounded-md text-[9px] font-black text-white uppercase tracking-tighter">
                     #{i + 1}
                   </div>
                 </div>
               ))}
               {parsedImages.length === 0 && (
                 <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300">
                    <ImageIcon size={40} strokeWidth={1} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No media selected</p>
                 </div>
               )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Direct Resource URLs</label>
                <div className="flex items-center gap-1.5 text-indigo-500 text-[9px] font-black uppercase tracking-[0.1em]">
                  <CheckCircle2 size={10} />
                  <span>External CDN Supported</span>
                </div>
              </div>
              <textarea 
                rows={6}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-[11px] text-slate-500 resize-none"
                placeholder="https://example.com/image.jpg"
                value={form.images} 
                onChange={updateField("images")} 
              />
              <p className="text-[10px] text-slate-400 font-medium px-1 flex items-center gap-2">
                 <Info size={10} />
                 <span>Add one direct image link per line for manual control over assets.</span>
              </p>
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-black tracking-tight mb-2">Publishing Guidance</h3>
            <p className="text-indigo-100/70 text-sm font-medium leading-relaxed mb-6">
              Ensure you have at least 3 high-resolution images. Products with detailed descriptions and accurate size charts see 40% higher conversion rates.
            </p>
            <div className="space-y-4">
               {[
                 { label: "Valid Category Selected", check: !!form.categoryId },
                 { label: "At least One Variant Added", check: form.variants.length > 0 },
                 { label: "Product Imagery Present", check: parsedImages.length > 0 }
               ].map((task, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${task.check ? "bg-white text-indigo-600" : "bg-white/10 text-white/30"}`}>
                      {task.check ? <CheckCircle2 size={12} strokeWidth={3} /> : <div className="h-1.5 w-1.5 rounded-full bg-current"></div>}
                   </div>
                   <span className={`text-xs font-black uppercase tracking-widest ${task.check ? "text-white" : "text-white/40"}`}>{task.label}</span>
                 </div>
               ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
