// src/pages/Catalogo.jsx
import React, { useEffect, useState, useMemo } from "react";
import ProductCard from "../components/ProductCard";
import { FaSearch, FaHome } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ProductFilters } from "../figma-ui/ProductFilters";

// 🔑 Base de la API
const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_BASE = `${API_APP}/api`;

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  // Filtros principales
  const [filters, setFilters] = useState({
    sortBy: "popular",
    categories: [],
    priceRange: [0, 500],
    ratingAtLeast: null,
    inStock: false,
    onSale: false,
    isNew: false,
  });

  // Filtro rápido desde header (?categoria=ID)
  const [quickCategoryId, setQuickCategoryId] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  /* =========================
     Leer parámetros de URL
     - ?search=
     - ?categoria=
     - ?ofertas=1
     ========================= */
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");

      const q = (params.get("search") || "").trim();
      const cat = (params.get("categoria") || "").trim();
      const ofertas = (params.get("ofertas") || "").trim();

      // Buscador
      setBusqueda(q);

      // Filtro rápido de categoría
      setQuickCategoryId(cat);

      // Activar ofertas si viene ?ofertas=1
      if (ofertas === "1" || ofertas.toLowerCase() === "true") {
        setFilters((prev) => ({
          ...prev,
          onSale: true,
        }));
      }
    } catch (err) {
      console.error("Error leyendo parámetros de URL:", err);
    }
  }, [location.search]);

  /* =========================
     Cargar productos una sola vez
     ========================= */
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await fetch(`${API_BASE}/productos`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando productos:", err);
        setProductos([]);
      }
    };
    cargarProductos();
  }, []);

  /* =========================
     Aplicar filtros + búsqueda + quickCategoryId
     ========================= */
  const productosFiltrados = useMemo(() => {
    let result = [...productos];

    const {
      sortBy,
      categories,
      priceRange,
      ratingAtLeast,
      inStock,
      onSale,
      isNew,
    } = filters;

    // --- Categoría combinada: panel + rápida desde URL ---
    if (categories.length > 0 || quickCategoryId) {
      result = result.filter((p) => {
        const catId = String(p.categoria_id ?? "");

        const matchPanel =
          categories.length === 0 ? true : categories.includes(catId);

        const matchQuick = quickCategoryId
          ? catId === quickCategoryId
          : true;

        return matchPanel && matchQuick;
      });
    }

    // --- Rango de precio ---
    result = result.filter((p) => {
      const price = Number(p.precio ?? 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // --- Stock ---
    if (inStock) {
      result = result.filter((p) => Number(p.stock_actual ?? p.stock ?? 0) > 0);
    }

    // --- En oferta ---
    if (onSale) {
      result = result.filter((p) => !!p.en_oferta);
    }

    // --- Nuevos ---
    if (isNew) {
      result = result.filter((p) => {
        if (!p.creado_en) return true;
        const fecha = new Date(p.creado_en);
        const diffDias =
          (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);
        return diffDias <= 30;
      });
    }

    // --- Rating mínimo ---
    if (ratingAtLeast != null) {
      result = result.filter((p) => {
        const rating = Number(
          p.rating ?? p.valoracion ?? p.puntuacion ?? NaN
        );
        if (Number.isNaN(rating)) return true;
        return rating >= ratingAtLeast;
      });
    }

    // --- Buscador ---
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      result = result.filter((p) => {
        return (
          (p.nombre || "").toLowerCase().includes(termino) ||
          (p.descripcion || "").toLowerCase().includes(termino) ||
          (p.categoria_nombre || "").toLowerCase().includes(termino)
        );
      });
    }

    // --- Ordenamiento ---
    const getPrice = (p) => Number(p.precio ?? 0) || 0;
    const getRating = (p) =>
      Number(p.rating ?? p.valoracion ?? p.puntuacion ?? 0) || 0;

    if (sortBy === "price-low") {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === "rating") {
      result.sort((a, b) => getRating(b) - getRating(a));
    } else if (sortBy === "newest") {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return result;
  }, [productos, filters, busqueda, quickCategoryId]);

  // Carrito
  const handleAddedToCart = () => {
    window.dispatchEvent(
      new CustomEvent("cart:add", { detail: { amount: 1 } })
    );
    window.dispatchEvent(new Event("cart:changed"));
    window.dispatchEvent(new Event("cart:open"));
  };

  const total = productosFiltrados.length;

  return (
    <div
      className="
        min-h-screen overflow-x-hidden
        bg-gradient-to-b from-black via-black to-fuchsia-950
        text-white relative
      "
    >
      {/* Aurora */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[260px] h-[520px] rounded-full bg-gradient-to-b from-fuchsia-500 via-purple-700 to-black blur-3xl" />
        <div className="absolute bottom-[-180px] left-10 w-[360px] h-[360px] rounded-full bg-purple-700 blur-3xl" />
        <div className="absolute bottom-[-220px] right-0 w-[380px] h-[380px] rounded-full bg-pink-500 blur-3xl" />
      </div>

      <div className="relative max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Título */}
        <h1 className="koko-page-title font-extrabold flex items-center gap-3 text-2xl sm:text-3xl md:text-4xl mb-4 sm:mb-6 md:mb-8 tracking-tight">
          <span className="text-2xl sm:text-3xl md:text-4xl">🛒</span>
          <span><span className="kuromi-text">Catálogo de Productos</span></span>
        </h1>

        {/* Buscador */}
        <div className="mb-6 sm:mb-8">
          <label className="relative w-full md:max-w-xl block mx-auto md:mx-0">
            <FaSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600/80 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar productos kawaii…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="
                w-full h-11 sm:h-12 pl-10 pr-4 rounded-full
                bg-white/95 text-purple-900 placeholder-purple-400
                border-2 border-fuchsia-500/40 shadow-sm
                focus:outline-none focus:bg-white focus:border-fuchsia-500
                focus:ring-2 focus:ring-pink-400/70 transition-all text-sm
              "
            />
          </label>

          {busqueda.trim() && (
            <p className="text-xs sm:text-sm text-pink-200 mt-2">
              Mostrando resultados para{" "}
              <span className="font-semibold">“{busqueda.trim()}”</span>
            </p>
          )}
        </div>

        {/* Filtros + productos */}
        <div className="grid gap-8 lg:grid-cols-[290px,1fr] items-start">
          <ProductFilters onFiltersChange={setFilters} />

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs sm:text-sm text-purple-100/80 px-1">
              <span>
                Mostrando{" "}
                <span className="font-semibold text-fuchsia-300">{total}</span>{" "}
                productos
              </span>
            </div>

            {productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                {productosFiltrados.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onAddedToCart={handleAddedToCart}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-pink-200 mt-10">
                😢 No se encontraron productos con estos filtros.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botón Home */}
      <Motion.button
        onClick={() => navigate("/")}
        className="fixed bottom-6 left-6 bg-pink-500 hover:bg-pink-600 text-white px-5 py-4 rounded-full shadow-lg flex items-center justify-center text-xl z-50"
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 0 rgba(0,0,0,0)",
            "0 0 20px rgba(236,72,153,0.5)",
            "0 0 0 rgba(0,0,0,0)",
          ],
        }}
        transition={{ repeat: Infinity, repeatType: "loop", duration: 2 }}
      >
        <FaHome />
      </Motion.button>
    </div>
  );
};

export default Catalogo;
