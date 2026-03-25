import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { User, MapPin, Phone, Mail, ShieldCheck, Loader2 } from "lucide-react";

const emptyProfile = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: ""
};

// --- Validation helpers ---
const normalizePhone = (value) => value.replace(/[^\d+]/g, ""); // keep digits and +
const isValidPhone = (value) => {
  if (!value) return false;
  const v = normalizePhone(value);
  return /^\+?\d{10,15}$/.test(v);
};

// Accept global-ish postal formats
const isValidPostal = (value) => {
  if (!value) return false;
  return /^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(value.trim());
};

// India pincode (6 digits)
const isIndianPincode = (value) => /^\d{6}$/.test((value || "").trim());

const requiredFields = ["name", "addressLine1", "city", "state", "postalCode", "country", "phone"];

function validate(form) {
  const errors = {};

  // Required
  for (const f of requiredFields) {
    if (!form[f]?.trim()) errors[f] = "This field is required.";
  }

  // Name
  if (form.name && form.name.trim().length < 2) errors.name = "Please enter your full name.";

  // Postal (generic)
  if (form.postalCode && !isValidPostal(form.postalCode)) {
    errors.postalCode = "Enter a valid postal/ZIP code.";
  }

  // Phone
  if (form.phone && !isValidPhone(form.phone)) {
    errors.phone = "Enter a valid phone number (10–15 digits, optional +).";
  }

  // Address sanity
  if (form.addressLine1 && form.addressLine1.trim().length < 5) {
    errors.addressLine1 = "Address looks too short.";
  }

  return errors;
}

const Field = ({ label, hint, error, children, footer, icon: Icon }) => {
  return (
    <div className="flex flex-col gap-1.5 focus-within:text-slate-900 text-slate-700 transition-colors">
      <div className="flex items-end justify-between gap-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          {label}
        </label>
        {hint && <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-rose-500 mt-1">{error}</p>}
      {footer && <div className="text-xs text-slate-500 mt-1">{footer}</div>}
    </div>
  );
};

export default function Profile() {
  const { isAuthenticated, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formState, setFormState] = useState(emptyProfile);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });
  const [initialLoading, setInitialLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Pincode lookup UI state
  const [pinStatus, setPinStatus] = useState({ loading: false, error: "", filled: false });
  const pinAbortRef = useRef(null);
  const pinLastRef = useRef("");

  const errors = useMemo(() => validate(formState), [formState]);
  const visibleError = (field) => (!submitted && !touched[field] ? "" : errors[field] || "");

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    async function load() {
      setStatus({ loading: true, error: "", success: "" });
      setInitialLoading(true);
      try {
        const data = await apiGet("/profile", { auth: true });
        if (!active) return;
        setProfile(data);
        setFormState({
          name: data.name || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          state: data.state || "",
          postalCode: data.postalCode || "",
          country: data.country || "",
          phone: data.phone || ""
        });
      } catch (err) {
        if (!active) return;
        setStatus({ loading: false, error: err.message || "Failed to load profile.", success: "" });
      } finally {
        if (active) {
          setInitialLoading(false);
          setStatus((prev) => ({ ...prev, loading: false }));
        }
      }
    }
    load();
    return () => { active = false; };
  }, [isAuthenticated]);

  const updateField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setStatus((prev) => ({ ...prev, error: "", success: "" }));
  };

  const markTouched = (key) => setTouched((prev) => ({ ...prev, [key]: true }));
  const canSubmit = !status.loading && Object.keys(errors).length === 0;

  useEffect(() => {
    const pin = (formState.postalCode || "").trim();
    setPinStatus((prev) => ({ ...prev, filled: false, error: prev.loading ? prev.error : "" }));

    if (!isIndianPincode(pin)) {
      if (pinAbortRef.current) pinAbortRef.current.abort();
      setPinStatus({ loading: false, error: "", filled: false });
      pinLastRef.current = "";
      return;
    }

    if (pinLastRef.current === pin) return;

    const t = setTimeout(async () => {
      try {
        pinLastRef.current = pin;
        if (pinAbortRef.current) pinAbortRef.current.abort();
        const controller = new AbortController();
        pinAbortRef.current = controller;

        setPinStatus({ loading: true, error: "", filled: false });

        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { method: "GET", signal: controller.signal });
        if (!res.ok) throw new Error("Unable to lookup pincode.");
        const json = await res.json();
        const first = Array.isArray(json) ? json[0] : null;

        if (!first || first.Status !== "Success" || !Array.isArray(first.PostOffice) || !first.PostOffice.length) {
          setPinStatus({ loading: false, error: "Pincode not found. Please enter city/state manually.", filled: false });
          return;
        }

        const po = first.PostOffice[0];
        setFormState((prev) => ({
          ...prev,
          city: (po.District || "").trim() || prev.city,
          state: (po.State || "").trim() || prev.state,
          country: prev.country?.trim() ? prev.country : "India"
        }));

        setPinStatus({ loading: false, error: "", filled: true });
      } catch (e) {
        if (e?.name === "AbortError") return;
        setPinStatus({ loading: false, error: "Couldn’t fetch address for this pincode.", filled: false });
      }
    }, 350);

    return () => clearTimeout(t);
  }, [formState.postalCode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setStatus({ loading: false, error: "", success: "" });

    const currentErrors = validate(formState);
    if (Object.keys(currentErrors).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStatus({ loading: false, error: "Please fix the highlighted fields below.", success: "" });
      return;
    }

    const payload = {
      ...formState,
      name: formState.name.trim(),
      addressLine1: formState.addressLine1.trim(),
      addressLine2: formState.addressLine2.trim(),
      city: formState.city.trim(),
      state: formState.state.trim(),
      postalCode: formState.postalCode.trim(),
      country: formState.country.trim(),
      phone: normalizePhone(formState.phone.trim())
    };

    try {
      setStatus({ loading: true, error: "", success: "" });
      const updated = await apiPut("/profile", payload, { auth: true });
      setProfile(updated);
      updateUser(updated);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStatus({ loading: false, error: "", success: "Profile updated successfully." });
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Failed to update profile.", success: "" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center px-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <ShieldCheck className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-3xl font-light text-slate-900 mb-3">Login Required</h2>
        <p className="text-slate-600 mb-8 font-light leading-relaxed">
          Access your personalized profile to manage order histories, delivery preferences, and account settings.
        </p>
        <Link className="btn-primary w-full sm:w-auto px-10" to="/login">
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  if (initialLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-slate-300" />
            <p className="font-light tracking-wide uppercase text-sm">Loading Account</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 lg:pl-4">
          <h1 className="text-3xl font-light tracking-tight text-slate-900">Account Settings</h1>
          <p className="mt-2 text-slate-500 font-light">Manage your personal details and delivery preferences.</p>
        </div>

        {/* Status Alerts */}
        <div className="lg:pl-4 mb-8">
            {status.error && !status.error.includes("API error (401)") && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <p className="text-sm font-medium">{status.error}</p>
              </div>
            )}
            {status.success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500"></span>
                <p className="text-sm font-medium">{status.success}</p>
              </div>
            )}
        </div>

        {/* Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar / Identity Card */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-inner mb-6">
                 <span className="text-3xl font-light text-slate-700 tracking-widest">
                   {(formState.name || profile?.email || "US").slice(0, 2).toUpperCase()}
                 </span>
              </div>
              <h2 className="text-xl font-medium text-slate-900 line-clamp-1">{formState.name || "Customer"}</h2>
              <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                <Mail className="w-4 h-4" />
                <span className="truncate">{profile?.email || "No email linked"}</span>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100 w-full">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Account Status</p>
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Verification</span>
                      <span className="text-emerald-600 font-medium flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Verified</span>
                  </div>
              </div>
            </div>

            {/* Helper Card */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-5 mix-blend-overlay"></div>
                <h3 className="font-medium text-lg mb-2">Need help?</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
                    If you are having trouble updating your delivery address or account details, our support team is available 24/7.
                </p>
                <Link to="/contact" className="text-sm font-semibold text-white border-b border-white/30 pb-1 hover:border-white transition-colors">
                    Contact Support
                </Link>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="w-full lg:w-2/3">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {/* Personal Details */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="mb-6 pb-6 border-b border-slate-100">
                    <h2 className="text-xl font-medium text-slate-900">Personal Details</h2>
                    <p className="text-slate-500 text-sm font-light mt-1">Information used to communicate with you.</p>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Full Name" icon={User} error={visibleError("name")}>
                    <input
                      className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10 ${
                        visibleError("name") ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder="Jane Doe"
                      value={formState.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      onBlur={() => markTouched("name")}
                    />
                  </Field>

                  <Field label="Phone Number" icon={Phone} error={visibleError("phone")}>
                    <input
                      className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10 ${
                        visibleError("phone") ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder="+91 9876543210"
                      value={formState.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      onBlur={() => markTouched("phone")}
                      inputMode="tel"
                    />
                  </Field>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="mb-6 pb-6 border-b border-slate-100">
                    <h2 className="text-xl font-medium text-slate-900 flex items-center gap-2">
                        Delivery Address
                    </h2>
                    <p className="text-slate-500 text-sm font-light mt-1">Where your orders will be shipped.</p>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Address Line 1" icon={MapPin} error={visibleError("addressLine1")}>
                      <input
                        className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10 ${
                          visibleError("addressLine1") ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
                        }`}
                        placeholder="Street address, P.O. box, company name, c/o"
                        value={formState.addressLine1}
                        onChange={(e) => updateField("addressLine1", e.target.value)}
                        onBlur={() => markTouched("addressLine1")}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Address Line 2 (Optional)" hint="Optional">
                      <input
                        className="w-full rounded-xl border border-slate-200 focus:border-slate-400 bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10"
                        placeholder="Apartment, suite, unit, building, floor, etc."
                        value={formState.addressLine2}
                        onChange={(e) => updateField("addressLine2", e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label="City" error={visibleError("city")}>
                    <input
                      className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10 ${
                        visibleError("city") ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder="City"
                      value={formState.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      onBlur={() => markTouched("city")}
                    />
                  </Field>

                  <Field label="State / Province" error={visibleError("state")}>
                    <input
                      className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10 ${
                        visibleError("state") ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder="State"
                      value={formState.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      onBlur={() => markTouched("state")}
                    />
                  </Field>

                  <Field
                    label="Postal Code"
                    error={visibleError("postalCode")}
                    footer={
                      pinStatus.loading ? (
                        <span className="inline-flex items-center gap-2 mt-1">
                          <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                          <span className="text-slate-500 font-medium">Fetching details...</span>
                        </span>
                      ) : pinStatus.error ? (
                        <span className="text-rose-500 font-medium mt-1">{pinStatus.error}</span>
                      ) : pinStatus.filled ? (
                        <span className="text-emerald-600 font-medium mt-1">✔ Auto-filled city & state.</span>
                      ) : (
                        <span className="text-slate-400 mt-1 block">Valid India pincodes auto-fill location.</span>
                      )
                    }
                  >
                    <input
                      className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10 ${
                        visibleError("postalCode") ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder="e.g. 560001"
                      value={formState.postalCode}
                      onChange={(e) => updateField("postalCode", e.target.value)}
                      onBlur={() => markTouched("postalCode")}
                      inputMode="numeric"
                    />
                  </Field>

                  <Field label="Country" error={visibleError("country")}>
                    <input
                      className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm focus:bg-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-slate-900/10 ${
                        visibleError("country") ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
                      }`}
                      placeholder="Country"
                      value={formState.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      onBlur={() => markTouched("country")}
                    />
                  </Field>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-2 mb-10">
                <p className="text-sm text-slate-500 font-light text-center sm:text-left">
                  Your data is securely encrypted and stored.
                </p>
                <button
                  className="w-full sm:w-auto btn-primary px-10 h-12 shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                  type="submit"
                  disabled={!canSubmit || status.loading}
                >
                  {status.loading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </span>
                  ) : (
                      "Save Preferences"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
