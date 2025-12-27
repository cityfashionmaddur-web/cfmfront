import React from "react";

export default function Terms() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Terms & Conditions</h1>
        <p className="text-sm text-slate-600">Your agreement when using CITYFASHION MADDUR products and services.</p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <ol className="space-y-4 text-sm leading-relaxed text-slate-700 list-decimal list-inside">
          <li>
            <span className="font-semibold text-slate-900">Acceptance.</span> By accessing our site or placing an order,
            you agree to these terms and our Privacy Policy.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Accounts.</span> Keep your account credentials secure. You are
            responsible for all activity under your account.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Orders & Payments.</span> Orders are subject to acceptance and
            availability. Prices and promotions may change. Payments are processed via our approved gateways.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Shipping & Delivery.</span> Delivery estimates are provided for
            convenience; delays can occur. Ensure address and contact details are accurate.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Returns.</span> Returns are accepted per our return policy
            outlined at checkout. Items must be unworn, with tags, and within the return window.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Prohibited Use.</span> Do not misuse the site, interfere with
            security, or engage in fraudulent purchases.
          </li>
          <li>
            <span className="font-semibold text-slate-900">IP Rights.</span> All content (logos, assets, copy) is owned by
            CITYFASHION MADDUR or its licensors. Do not reuse without permission.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Liability.</span> To the maximum extent permitted by law, we are
            not liable for indirect or consequential losses arising from use of the site or products.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Changes.</span> We may update these terms; continued use
            constitutes acceptance of the latest version.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Contact.</span> Questions? Reach us at info@cityfashionmaddur.com.
          </li>
        </ol>
      </section>
    </div>
  );
}
