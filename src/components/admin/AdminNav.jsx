import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Layers, 
  Image as ImageIcon 
} from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", Icon: Users },
  { to: "/admin/categories", label: "Categories", Icon: Layers },
  { to: "/admin/hero", label: "Hero Slides", Icon: ImageIcon }
];

export default function AdminNav() {
  return (
    <nav className="admin-nav">
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/admin"}
          className={({ isActive }) => (isActive ? "admin-link active" : "admin-link")}
        >
          <Icon size={18} strokeWidth={2.5} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
