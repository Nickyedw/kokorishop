// src/pages/Catalogo.jsx
import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { FaSearch, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";

// 🔑 Base de la API desde .env (.env.development / .env.production)
const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Catalogo = () => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await fetch(`${API_APP}/api/categorias`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setCategorias(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
        setCategorias([]);
      }
    };
    cargarCategorias();
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const url = categoriaSeleccionada
          ? `${API_APP}/api/productos/categoria/${categoriaSeleccionada}`
          : `${API_APP}/api/productos`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setProductos([]);
      }
    };
    cargarProductos();
  }, [categoriaSeleccionada]);

  const productosFiltrados = productos.filter((p) => {
    const termino = busqueda.toLowerCase();
    return (
      (p.nombre || "").toLowerCase().includes(termino) ||
      (p.descripcion || "").toLowerCase().includes(termino) ||
      (p.categoria_nombre || "").toLowerCase().includes(termino)
    );
  });

  // 👉 igual que en Home: al agregar al carrito notificamos globalmente
  const handleAddedToCart = () => {
    window.dispatchEvent(new CustomEvent("cart:add", { detail: { amount: 1 } }));
    window.dispatchEvent(new Event("cart:changed"));
    window.dispatchEvent(new Event("cart:open"));
  };

  return (
    <div className="min-h-screen bg-purple-900 text-white px-4 sm:px-6 py-6">
      {/* Título */}
      <h1
        className="
          koko-page-title font-extrabold text-white flex items-center gap-2
          text-2xl sm:text-3xl md:text-4xl mb-4 sm:mb-5 md:mb-6 lg:mb-8
        "
      >
        <span className="text-2xl sm:text-3xl">🛒</span>
        Catálogo de Productos
      </h1>

      {/* Filtros */}
      <div
        className="
          flex flex-col md:flex-row md:items-center md:justify-between
          gap-3 sm:gap-4 md:gap-5 mb-5 sm:mb-6 md:mb-8
        "
      >
        {/* Categorías */}
        <label className="w-full md:w-auto">
          <span className="sr-only">Filtrar por categoría</span>
          <select
            aria-label="Filtrar por categoría"
            className="
              w-full md:w-[280px] h-11 sm:h-12 px-4 pr-10 rounded-full
              bg-white text-purple-900 shadow-sm ring-1 ring-white/20
              focus:outline-none focus:ring-2 focus:ring-pink-400
            "
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          >
            <option value="">📦 Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </label>

        {/* Buscador */}
        <label className="relative w-full md:max-w-xl">
          <span className="sr-only">Buscar productos</span>
          <input
            type="text"
            aria-label="Buscar productos"
            placeholder="Buscar productos…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="
              w-full h-11 sm:h-12 pl-4 pr-11 rounded-full
              bg-white text-purple-900 placeholder-purple-400
              shadow-sm ring-1 ring-white/20
              focus:outline-none focus:ring-2 focus:ring-pink-400
            "
          />
          <FaSearch
            className="
              absolute right-4 top-1/2 -translate-y-1/2
              text-purple-600/80 pointer-events-none
            "
            aria-hidden="true"
          />
        </label>
      </div>

      {/* Lista de productos */}
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
        <p className="text-center text-pink-200 mt-10">😢 No se encontraron productos.</p>
      )}

      {/* Botón flotante Home */}
      <Motion.button
        onClick={() => navigate("/")}
        className="
          fixed bottom-6 left-6 bg-pink-500 hover:bg-pink-600
          text-white px-5 py-4 rounded-full shadow-lg
          flex items-center justify-center text-xl z-50
        "
        title="Regresar a la tienda"
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

      {/* ⛔️ Eliminado: <MiniCart .../> — lo renderiza CartLayout globalmente */}
    </div>
  );
};

export default Catalogo;
