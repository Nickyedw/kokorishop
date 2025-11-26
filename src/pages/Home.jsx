// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { FaHeart, FaBars, FaShoppingBag } from "react-icons/fa";
import { Link } from "react-router-dom";

// FIGMA UI
import { Header } from "../figma-ui/Header";
import { HeroSection } from "../figma-ui/HeroSection";
import { TrustBadges } from "../figma-ui/TrustBadges";
import { Newsletter } from "../figma-ui/Newsletter";

import ProductCard from "../components/ProductCard";
// (por ahora no usas estos contexts en este archivo, los dejamos comentados)
// import { CartContext } from "../context/CartContext";
// import { FavoritesContext } from "../context/FavoritesContext";
import BestSellersSection from "../sections/BestSellersSection";
import Footer from "../components/Footer";

const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_BASE = `${API_APP}/api`;

const Home = () => {
  const [destacados, setDestacados] = useState([]);
  //const [oferta, setOferta] = useState([]);

  const readBool = (k) => {
    const v = (localStorage.getItem(k) || "").toString().trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  };

  const readRoleIsAdmin = (...keys) =>
    keys.some(
      (k) =>
        (localStorage.getItem(k) || "").toString().trim().toLowerCase() ===
        "admin"
    );

  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("admin") === "1") localStorage.setItem("is_admin", "true");
  } catch {
    /* noop */
  }

  const isAdmin =
    readRoleIsAdmin("usuario_rol", "rol", "role") ||
    readBool("usuario_is_admin") ||
    readBool("is_admin") ||
    readBool("es_admin") ||
    readBool("admin") ||
    readBool("isAdmin");

  useEffect(() => {
    const cargarSecciones = async () => {
      try {
        const bust = `?bust=${Date.now()}`;
        const [resDestacados, resOferta] = await Promise.all([
          fetch(`${API_BASE}/productos/destacados${bust}`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE}/productos/oferta${bust}`, { cache: "no-store" }),
        ]);

        //const [dataDestacados, dataOferta] = await Promise.all([
        const [dataDestacados] = await Promise.all([
          resDestacados.json(),
          resOferta.json(),
        ]);

        setDestacados(Array.isArray(dataDestacados) ? dataDestacados : []);
        //setOferta(Array.isArray(dataOferta) ? dataOferta : []);
      } catch (err) {
        console.error("Error al cargar secciones del home:", err);
      }
    };
    cargarSecciones();
  }, []);

  const handleAddedToCart = () => {
    window.dispatchEvent(new CustomEvent("cart:add", { detail: { amount: 1 } }));
    window.dispatchEvent(new Event("cart:changed"));
    window.dispatchEvent(new Event("cart:open"));
  };

 //const pagePaddingBottom = isAdmin ? "pb-[88px]" : "";
 const pagePaddingBottom = isAdmin;

  return (
    <div
      className={`min-h-screen bg-purple-900 text-white ${pagePaddingBottom}`}
    >
      <Header />

      {/* === HERO FIGMA + BADGES === */}
      <HeroSection />
      <TrustBadges />

      {/* Sección: Productos Destacados */}
      {destacados.length > 0 && (
        <section className="px-6 mt-8">
          <h2 className="flex items-center gap-2 mb-4 text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-300 drop-shadow-[0_1px_0_rgba(0,0,0,.25)]">
            <span className="text-lg sm:text-xl lg:text-2xl" aria-hidden>
              ⭐
            </span>
            Productos Destacados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {destacados.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddedToCart={handleAddedToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sección: Más Vendidos (Figma layout) */}
      <BestSellersSection onAddedToCart={handleAddedToCart} />

      {/* Sección: Productos en Oferta */}
      {/*{oferta.length > 0 && (
        <section className="px-6 mt-10">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-red-300 mb-4">
            💥 Productos en Oferta
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {oferta.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddedToCart={handleAddedToCart}
              />
            ))}
          </div>
        </section>
      )}*/}

      {/* Newsletter nuevo diseño (Figma) */}
      <Newsletter />

      {/* Footer estilo Figma + lógica Kokorishop */}
      {/*<Footer />*/}

      {/* Footer admin flotante (solo si es admin) */}
      {/*{isAdmin && (
        <footer className="fixed bottom-0 left-0 right-0 bg-purple-800 text-purple-200 shadow-inner flex justify-around py-3 rounded-t-3xl">
          <Link to="/" className="flex flex-col items-center text-sm">
            <FaShoppingBag className="text-xl" />
            Home
          </Link>
          <Link to="/favorites" className="flex flex-col items-center text-sm">
            <FaHeart className="text-xl" />
            Favorites
          </Link>
          <Link to="/cart" className="flex flex-col items-center text-sm">
            <FaShoppingBag className="text-xl" />
            Cart
          </Link>
          <Link to="/admin" className="flex flex-col items-center text-sm">
            <FaBars className="text-xl" />
            Menu
          </Link>
        </footer>
      )}*/}
    </div>
  );
};

export default Home;
