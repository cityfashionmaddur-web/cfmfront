import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import Footer from "./Footer.jsx";
import MiniCartDrawer from "./MiniCartDrawer.jsx";

export default function Layout({ children }) {
  const content = children ?? <Outlet />;
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:font-medium focus:shadow-xl transition-all"
      >
        Skip to content
      </a>
      <NavBar />
      <main
        id="main-content"
        className="container mx-auto flex-1 px-4 pt-20 pb-12 sm:px-6 outline-none"
        tabIndex={-1}
      >
        {content}
      </main>
      <Footer />
      <MiniCartDrawer />
    </div>
  );
}
