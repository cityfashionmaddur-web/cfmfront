import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "./ToastContext.jsx";

const CartContext = createContext(null);
const STORAGE_KEY = "cityfashion_cart_v1";

function loadCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load cart", err);
    return [];
  }
}

function calculateShipping(subtotal) {
  if (subtotal <= 0) return 0;
  if (subtotal <= 500) return 50;
  if (subtotal <= 2500) return 100;
  if (subtotal <= 3500) return 200;
  if (subtotal <= 5000) return 300;
  if (subtotal <= 7000) return 400;
  return 500;
}

export function CartProvider({ children }) {
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to persist cart", err);
    }
  }, [items, hydrated]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0),
    [items]
  );

  const shippingFee = useMemo(() => calculateShipping(subtotal), [subtotal]);
  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [items]
  );

  const addItem = (product, quantity = 1) => {
    if (!product) return false;
    const stock = product.stock !== undefined ? product.stock : Infinity;
    const existing = items.find((p) => p.id === product.id);
    const currentQty = existing ? existing.quantity || 1 : 0;

    if (currentQty + quantity > stock) {
      push(`Only ${stock} left in stock. Adjust quantity.`, "error");
      return false;
    }

    setItems((prev) => {
      const existingItem = prev.find((p) => p.id === product.id);
      if (existingItem) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, quantity: (p.quantity || 1) + quantity, stock: product.stock }
            : p
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          slug: product.slug,
          image: product.productImages?.[0]?.url,
          quantity: quantity || 1,
          stock: product.stock
        }
      ];
    });
    setDrawerOpen(true);
    push("Added to cart", "success");
    return true;
  };

  const updateQuantity = (id, quantity) => {
    const numericQty = Math.max(Number(quantity) || 0, 0);
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const capped = item.stock !== undefined && numericQty > item.stock ? item.stock : numericQty;
          return { ...item, quantity: capped };
        })
        .filter((item) => (item.quantity || 0) > 0)
    );
  };

  const updateItemStock = (id, stock) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextQty = item.quantity && stock !== undefined ? Math.min(item.quantity, stock) : item.quantity;
        return { ...item, stock, quantity: nextQty };
      })
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    push("Removed from cart", "info");
  };

  const clear = () => {
    setItems([]);
    setDrawerOpen(false);
    push("Cart cleared", "info");
  };

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = () => setDrawerOpen((v) => !v);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      updateItemStock,
      removeItem,
      clear,
      subtotal,
      shippingFee,
      total,
      count,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      hydrated
    }),
    [items, subtotal, shippingFee, total, count, drawerOpen, hydrated]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
