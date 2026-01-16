import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

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

const Field = ({ label, hint, error, children, footer }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end justify-between gap-2">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {footer ? <div className="text-xs text-slate-500">{footer}</div> : null}
    </div>
  );
};

export default function Profile() {
  const { isAuthenticated, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [formState, setFormState] = useState(emptyProfile);

  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: ""
  });

  const [initialLoading, setInitialLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Pincode lookup UI state
  const [pinStatus, setPinStatus] = useState({ loading: false, error: "", filled: false });
  const pinAbortRef = useRef(null);
  const pinLastRef = useRef("");

  const errors = useMemo(() => validate(formState), [formState]);

  const visibleError = (field) => {
    if (!submitted && !touched[field]) return "";
    return errors[field] || "";
  };

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
        if (!active) return;
        setInitialLoading(false);
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const updateField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setStatus((prev) => ({ ...prev, error: "", success: "" }));
  };

  const markTouched = (key) => setTouched((prev) => ({ ...prev, [key]: true }));

  const canSubmit = !status.loading && Object.keys(errors).length === 0;

  // --- Pincode auto-fill (India) ---
  useEffect(() => {
    const pin = (formState.postalCode || "").trim();

    // Reset small helper UI if user is editing
    setPinStatus((prev) => ({
      ...prev,
      filled: false,
      error: prev.loading ? prev.error : ""
    }));

    // Only attempt for 6-digit India pincode
    if (!isIndianPincode(pin)) {
      // cancel any in-flight lookup
      if (pinAbortRef.current) pinAbortRef.current.abort();
      setPinStatus({ loading: false, error: "", filled: false });
      pinLastRef.current = "";
      return;
    }

    // Avoid repeat lookups for same pin
    if (pinLastRef.current === pin) return;

    // Debounce slightly so it feels smooth
    const t = setTimeout(async () => {
      try {
        pinLastRef.current = pin;

        // Cancel previous request
        if (pinAbortRef.current) pinAbortRef.current.abort();
        const controller = new AbortController();
        pinAbortRef.current = controller;

        setPinStatus({ loading: true, error: "", filled: false });

        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
          method: "GET",
          signal: controller.signal
        });

        if (!res.ok) throw new Error("Unable to lookup pincode.");
        const json = await res.json();

        // India Post API returns array with { Status, PostOffice }
        const first = Array.isArray(json) ? json[0] : null;

        if (!first || first.Status !== "Success" || !Array.isArray(first.PostOffice) || !first.PostOffice.length) {
          setPinStatus({ loading: false, error: "Pincode not found. Please enter city/state manually.", filled: false });
          return;
        }

        const po = first.PostOffice[0];
        const district = (po.District || "").trim();
        const state = (po.State || "").trim();

        setFormState((prev) => ({
          ...prev,
          city: district || prev.city,
          state: state || prev.state,
          // Nice default for India users
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
      setStatus({ loading: false, error: "Please fix the highlighted fields.", success: "" });
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
      setStatus({ loading: false, error: "", success: "Profile updated successfully." });
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Failed to update profile.", success: "" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-14 max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
          <span className="text-lg">🔒</span>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">Login required</h2>
        <p className="mt-2 text-slate-600">Sign in to view and update your profile details.</p>
        <Link
          className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
          to="/login"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Profile</h1>
          <p className="mt-1 text-slate-600">Keep your delivery and contact details up to date.</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <span className="text-lg font-semibold text-slate-900">
                  {(profile?.name || profile?.email || "U").slice(0, 2).toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-500">Signed in as</p>
                <p className="text-base font-semibold text-slate-900">{profile?.name || "—"}</p>
                <p className="text-sm text-slate-600">{profile?.email || ""}</p>
              </div>
            </div>

            <div className="text-sm text-slate-500">
              {status.loading ? "Saving changes…" : "All changes are saved when you click Save."}
            </div>
          </div>
        </div>

        {initialLoading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm">
              Loading your profile…
            </div>
          </div>
        )}

        <form className="px-6 py-6" onSubmit={handleSubmit}>
          {status.error && !status.error.includes("API error (401)") && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {status.error}
            </div>
          )}
          {status.success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {status.success}
            </div>
          )}

          <div className="grid gap-8">
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Personal</h2>
                <p className="mt-1 text-sm text-slate-600">Your basic account details.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={visibleError("name")} hint="Required">
                  <input
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:ring-4 focus:ring-slate-900/5 ${
                      visibleError("name")
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-slate-900"
                    }`}
                    placeholder="Full name"
                    value={formState.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    onBlur={() => markTouched("name")}
                    aria-invalid={Boolean(visibleError("name"))}
                  />
                </Field>

                <Field label="Phone number" error={visibleError("phone")} hint="Required">
                  <input
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:ring-4 focus:ring-slate-900/5 ${
                      visibleError("phone")
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-slate-900"
                    }`}
                    placeholder="+91 9876543210"
                    value={formState.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    onBlur={() => markTouched("phone")}
                    aria-invalid={Boolean(visibleError("phone"))}
                    inputMode="tel"
                  />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Delivery address</h2>
                <p className="mt-1 text-sm text-slate-600">Used for order deliveries.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Address line 1" error={visibleError("addressLine1")} hint="Required">
                    <input
                      className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:ring-4 focus:ring-slate-900/5 ${
                        visibleError("addressLine1")
                          ? "border-rose-300 focus:border-rose-500"
                          : "border-slate-200 focus:border-slate-900"
                      }`}
                      placeholder="Street address"
                      value={formState.addressLine1}
                      onChange={(e) => updateField("addressLine1", e.target.value)}
                      onBlur={() => markTouched("addressLine1")}
                      aria-invalid={Boolean(visibleError("addressLine1"))}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Address line 2" error={visibleError("addressLine2")} hint="Optional">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
                      placeholder="Apartment, suite, landmark, etc."
                      value={formState.addressLine2}
                      onChange={(e) => updateField("addressLine2", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="City" error={visibleError("city")} hint="Required">
                  <input
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:ring-4 focus:ring-slate-900/5 ${
                      visibleError("city")
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-slate-900"
                    }`}
                    placeholder="City"
                    value={formState.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    onBlur={() => markTouched("city")}
                    aria-invalid={Boolean(visibleError("city"))}
                  />
                </Field>

                <Field label="State" error={visibleError("state")} hint="Required">
                  <input
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:ring-4 focus:ring-slate-900/5 ${
                      visibleError("state")
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-slate-900"
                    }`}
                    placeholder="State"
                    value={formState.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    onBlur={() => markTouched("state")}
                    aria-invalid={Boolean(visibleError("state"))}
                  />
                </Field>

                <Field
                  label="Pincode / Postal code"
                  error={visibleError("postalCode")}
                  hint="Required"
                  footer={
                    pinStatus.loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                        Looking up city/state…
                      </span>
                    ) : pinStatus.error ? (
                      <span className="text-rose-600">{pinStatus.error}</span>
                    ) : pinStatus.filled ? (
                      <span className="text-emerald-700">City and state filled from pincode.</span>
                    ) : (
                      <span>Enter a 6-digit Indian pincode to auto-fill city/state.</span>
                    )
                  }
                >
                  <input
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:ring-4 focus:ring-slate-900/5 ${
                      visibleError("postalCode")
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-slate-900"
                    }`}
                    placeholder="e.g. 560001"
                    value={formState.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    onBlur={() => markTouched("postalCode")}
                    aria-invalid={Boolean(visibleError("postalCode"))}
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Country" error={visibleError("country")} hint="Required">
                  <input
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:ring-4 focus:ring-slate-900/5 ${
                      visibleError("country")
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-slate-900"
                    }`}
                    placeholder="Country"
                    value={formState.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    onBlur={() => markTouched("country")}
                    aria-invalid={Boolean(visibleError("country"))}
                  />
                </Field>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500">Tip: Use a phone number you can receive delivery calls on.</p>

              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={!canSubmit}
              >
                {status.loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
