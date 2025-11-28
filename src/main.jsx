// src/main.jsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import ScrollToTop from "./components/ScrollToTop";
import { HashRouter } from "react-router-dom";
import { CartProvider } from "./context/CartProvider";
import { FavoritesProvider } from "./context/FavoritesProvider";
import ComingSoon from "./pages/ComingSoon";

// 🔍 Detectar dominio actual
const hostname = window.location.hostname;

// 🟣 Dominios reales de producción donde queremos SOLO el Coming Soon
const isProdDomain =
  hostname === "kokorishop.com" || hostname === "www.kokorishop.com";

const root = ReactDOM.createRoot(document.getElementById("root"));

if (isProdDomain) {
  // 💜 En kokorishop.com: mostrar únicamente la pantalla "Muy pronto"
  root.render(
    <React.StrictMode>
      <ComingSoon />
    </React.StrictMode>
  );
} else {
  // 🧪 En GitHub Pages, vercel.app, localhost, etc.: app completa normal
  root.render(
    <React.StrictMode>
      <CartProvider>
        <FavoritesProvider>
          <HashRouter>
            <ScrollToTop />
            <App />
          </HashRouter>
        </FavoritesProvider>
      </CartProvider>
    </React.StrictMode>
  );
}
