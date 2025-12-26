import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/hero", label: "Hero Slides" }
];

export default function AdminNav() {
  return (
    <nav className="admin-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin"}
          className={({ isActive }) => (isActive ? "admin-link active" : "admin-link")}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
