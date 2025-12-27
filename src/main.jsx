import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import "./styles/global.css";
import "../assets/favicon.png";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <ToastProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
);
