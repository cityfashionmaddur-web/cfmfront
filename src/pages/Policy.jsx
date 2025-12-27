import React from "react";

export default function Policy() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-600">How CITYFASHION MADDUR collects, uses, and protects your data.</p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          We collect information you provide (name, email, address, phone) and data related to your orders, payments, and
          site usage. This helps us fulfill orders, provide support, improve the experience, and personalize content.
        </p>
        <p>
          Payments are processed by trusted gateways; we do not store full card details. We may use cookies and analytics
          tools to understand site performance. You can manage cookies via your browser settings.
        </p>
        <p>
          We do not sell your personal data. We may share limited information with service providers (payments, shipping,
          analytics) strictly to operate the service. Access is restricted to authorized personnel.
        </p>
        <p>
          You can request access, correction, or deletion of your data by contacting info@cityfashionmaddur.com. Some
          data (e.g., transaction records) may be retained to meet legal obligations.
        </p>
        <p>
          We implement reasonable security measures, but no method is 100% secure. If you suspect unauthorized access,
          contact us immediately. We will update this policy as needed; continued use means you accept the latest version.
        </p>
      </section>
    </div>
  );
}
