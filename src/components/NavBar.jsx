import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Menu, X, ShoppingBag, User } from "lucide-react";

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

  const bgClass = "bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300";

  const desktopLinkClass = ({ isActive }) =>
    `text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 relative py-2 ${
      isActive 
        ? "text-ink after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-ink" 
        : "text-gray-400 hover:text-ink after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-ink after:transition-all hover:after:w-full"
    }`;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 ${bgClass}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          {/* navbar height is exactly h-20 for more breathing room */}
          <div className="flex h-20 items-center justify-between gap-4">
            
            {/* Left: Mobile Menu & Logo */}
            <div className="flex items-center gap-4 lg:w-1/3">
              <button
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden p-2 -ml-2 text-ink transition hover:opacity-70"
                aria-label="Toggle menu"
              >
                {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
              </button>

              <Link to="/" className="flex items-center text-ink hover:opacity-80 transition-opacity">
                <img
                  src="https://files.cityfashionmaddur.com/assests/desktop.png"
                  alt="CityFashion Logo"
                  className="h-10 w-10 object-contain hidden sm:block"
                />
                <span className="sm:pl-3 text-sm md:text-base font-black tracking-[0.2em] uppercase leading-none">
                  CityFashion
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-10 lg:w-1/3">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-5 lg:w-1/3">
              {isAuthenticated ? (
                <>
                  <div className="relative hidden md:block" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((v) => !v)}
                      className="flex items-center gap-2 text-ink hover:opacity-70 transition-opacity"
                    >
                      <User strokeWidth={1.5} size={22} />
                      <span className="text-xs font-bold uppercase tracking-widest hidden xl:block">
                        {user?.name ? user.name.split(" ")[0] : "Account"}
                      </span>
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-4 w-56 bg-white border border-gray-100 shadow-2xl animate-fade-in origin-top-right">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Signed in as</p>
                           <p className="text-sm font-bold text-ink truncate">{user?.email}</p>
                        </div>
                        <Link to="/profile" className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-ink hover:bg-gray-50 transition-colors">
                          Profile Details
                        </Link>
                        <Link to="/orders" className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-ink hover:bg-gray-50 transition-colors border-t border-gray-50">
                          Order History
                        </Link>
                        <div className="border-t border-gray-100 p-2">
                           <button onClick={logout} className="w-full text-left px-2 py-3 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors">
                             Sign Out
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="hidden md:flex items-center gap-2 text-ink hover:opacity-70 transition-opacity"
                >
                  <User strokeWidth={1.5} size={22} />
                  <span className="text-xs font-bold uppercase tracking-widest hidden xl:block">Sign In</span>
                </Link>
              )}

              <Link
                to="/cart"
                className="relative flex items-center gap-2 text-ink hover:opacity-70 transition-opacity"
                aria-label="Cart"
              >
                <div className="relative">
                   <ShoppingBag strokeWidth={1.5} size={22} />
                   {count > 0 && (
                     <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-black text-white outline outline-2 outline-white">
                       {count}
                     </span>
                   )}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest hidden xl:block">Bag</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu (Off-Canvas) */}
      <div
        className={`fixed inset-0 z-40 lg:hidden bg-white text-ink transition-transform duration-500 ease-[0.16,1,0.3,1] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pt-24 px-6 h-full flex flex-col justify-between pb-12 overflow-y-auto">
           <nav className="flex flex-col space-y-8 mt-8">
             {links.map((link, index) => (
               <NavLink
                 key={link.to}
                 to={link.to}
                 className={({ isActive }) =>
                   `text-4xl sm:text-5xl font-heading tracking-tight transition-all duration-500 delay-${index * 100} ${
                     isActive ? "text-ink font-bold" : "text-gray-300 hover:text-ink"
                   } ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`
                 }
               >
                 {link.label}
               </NavLink>
             ))}
           </nav>

           <div className={`space-y-6 transition-all duration-700 delay-300 ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
             <div className="w-12 h-px bg-gray-200 mb-8"></div>
             {isAuthenticated ? (
               <div className="space-y-6">
                 <Link to="/profile" className="flex items-center justify-between text-sm font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-ink">
                   <span>Profile Settings</span>
                   <User size={16} />
                 </Link>
                 <Link to="/orders" className="flex items-center justify-between text-sm font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-ink">
                   <span>Order History</span>
                   <ShoppingBag size={16} />
                 </Link>
                 <button
                   type="button"
                   onClick={logout}
                   className="w-full text-left text-sm font-bold uppercase tracking-[0.2em] text-red-600 outline-none"
                 >
                   Sign out
                 </button>
               </div>
             ) : (
               <Link to="/login" className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-ink">
                 <User size={18} />
                 <span>Sign In / Create Account</span>
               </Link>
             )}
           </div>
        </div>
      </div>
    </>
  );
}
