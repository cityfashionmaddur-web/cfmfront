import React, { createContext, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const push = (message, variant = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => remove(id), 3000);
  };

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed right-4 top-4 z-[9999] flex w-full max-w-xs flex-col gap-2 sm:right-6 sm:top-6">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
                toast.variant === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : toast.variant === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
