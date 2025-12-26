import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const MenuIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BagIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
    />
  </svg>
);

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/categories", label: "Collections" },
];

export default function NavBar() {
  const { count } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  // close menus on route change
  useEffect(() => {
    setOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // click outside closes profile menu
  useEffect(() => {
    const onDocClick = (e) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const bgClass =
    "bg-gradient-to-b from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur border-b border-white/10";

  const desktopLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${
      isActive ? "text-white" : "text-white/70 hover:text-white"
    }`;

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2)?.toUpperCase();

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 ${bgClass}`}>
        <div className="mx-auto max-w-7xl px-4">
          {/* navbar height is exactly h-16 */}
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen((v) => !v)}
                className="md:hidden p-2 -ml-2 rounded-lg bg-white/10 text-white transition hover:bg-white/15"
                aria-label="Toggle menu"
              >
                {open ? <CloseIcon /> : <MenuIcon />}
              </button>

              <Link to="/" className="flex items-center text-white">
                <img
                  src="/assets/desktop.png"
                  alt="CITYFASHION MADDUR"
                  className="h-24 w-24 object-contain drop-shadow"
                />
                <span className="text-base md:text-xl font-bold tracking-wide uppercase">
                  CITYFASHION MADDUR
                </span>
              </Link>
            </div>

            {/* Center */}
            <nav className="hidden md:flex items-center gap-7">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div className="relative hidden md:block" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((v) => !v)}
                      className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white hover:bg-white/15"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[11px] font-bold uppercase">
                        {initials || "U"}
                      </span>
                      <span>{user?.name ? user.name.split(" ")[0] : "Profile"}</span>
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/15 bg-white text-slate-900 shadow-2xl">
                        <Link to="/profile" className="block px-4 py-3 text-sm font-semibold hover:bg-slate-50">
                          User data
                        </Link>
                        <Link to="/orders" className="block px-4 py-3 text-sm font-semibold hover:bg-slate-50 border-t border-slate-100">
                          Orders
                        </Link>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="hidden md:inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white hover:bg-white/15"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link to="/login" className="hidden md:inline-flex text-sm font-semibold text-white hover:text-white/80">
                  Sign in
                </Link>
              )}

              <Link
                to="/cart"
                className="relative rounded-full border border-white/30 px-3 py-2 text-white transition hover:border-white hover:bg-white/5"
                aria-label="Cart"
              >
                <div className="flex items-center gap-2">
                  <BagIcon />
                  <span className="hidden md:inline text-sm font-semibold">Bag</span>
                </div>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden pt-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-transform duration-500 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col px-8 space-y-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-3xl font-light tracking-tight ${
                  isActive ? "text-white font-medium border-l-4 border-white pl-4" : "text-white/60"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-10 px-8 space-y-3">
          {isAuthenticated ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Account</p>
                <Link to="/profile" className="block text-base font-semibold text-white">
                  User data
                </Link>
                <Link to="/orders" className="block text-base font-semibold text-white">
                  Orders
                </Link>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-semibold text-white/80 underline underline-offset-4"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-base font-semibold text-white">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
