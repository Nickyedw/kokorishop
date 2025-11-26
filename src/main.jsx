// src/main.jsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ScrollToTop from "./components/ScrollToTop";
import { HashRouter } from "react-router-dom";
import { CartProvider } from "./context/CartProvider";
import { FavoritesProvider } from "./context/FavoritesProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
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
