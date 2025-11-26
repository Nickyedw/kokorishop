// src/sections/BestSellersSection.jsx
import React, { useEffect, useState, useRef } from "react";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ProductFilters } from "../figma-ui/ProductFilters";

const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_BASE = `${API_APP}/api`;

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950/80 to-fuchsia-950/80 border border-fuchsia-500/20 animate-pulse">
      <div className="h-40 sm:h-48 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-1/2 bg-white/10 rounded" />
        <div className="h-9 bg-white/10 rounded-lg mt-3" />
      </div>
    </div>
  );
}

export default function BestSellersSection({ onAddedToCart }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  // estado de filtros que viene de ProductFilters
  const [filters, setFilters] = useState({
    sortBy: "popular",
    categories: [],       // ahora son IDs de categoría (string)
    priceRange: [0, 500],
    ratingAtLeast: null,
    inStock: false,
    onSale: false,
    isNew: false,
  });

  // Lazy load
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { rootMargin: "200px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Fetch productos (más vendidos)
  useEffect(() => {
    if (!visible) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/productos/mas-vendidos?bust=${Date.now()}`
        );
        const data = await res.json();
        if (alive) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, [visible]);

  // === APLICAR FILTROS Y ORDEN ===
  const filteredItems = React.useMemo(() => {
    if (!items) return [];

    const {
      sortBy,
      categories,
      priceRange,
      ratingAtLeast,
      inStock,
      onSale,
      isNew,
    } = filters;

    let result = [...items];

    // Rango de precio
    result = result.filter((p) => {
      const price = Number(p.precio ?? p.price ?? 0);
      if (Number.isNaN(price)) return false;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // CATEGORÍAS
    if (categories.length > 0) {
      result = result.filter((p) => {
        // 1) Preferimos filtrar por ID real si viene del backend
        const catIdRaw = p.categoria_id ?? p.categoriaId ?? null;

        if (catIdRaw != null) {
          const catId = String(catIdRaw);
          return categories.includes(catId);
        }

        // 2) Fallback: heurístico por nombre (por si algún producto viejo no tiene categoria_id)
        const catName = (
          p.categoria_nombre ||
          p.categoria ||
          ""
        )
          .toString()
          .toLowerCase();

        if (!catName) return false;

        return categories.some((id) => {
          // estos IDs ya no se usan como tal, pero mantenemos compatibilidad
          if (id === "plush") return catName.includes("peluch");
          if (id === "accessories") return catName.includes("accesor");
          if (id === "stationery")
            return catName.includes("papel") || catName.includes("útil");
          if (id === "tech")
            return (
              catName.includes("tecno") ||
              catName.includes("audífono") ||
              catName.includes("tecnología")
            );
          if (id === "decor") return catName.includes("deco");
          // si el ID es un número como "3", ya habrá pasado por el caso de arriba
          return false;
        });
      });
    }

    // Disponibilidad: en stock
    if (inStock) {
      result = result.filter((p) => {
        const stock = Number(p.stock_actual ?? p.stock ?? 0);
        return stock > 0;
      });
    }

    // En oferta
    if (onSale) {
      result = result.filter((p) => !!p.en_oferta);
    }

    // "Nuevos": si no hay campo, no filtramos nada especial
    if (isNew) {
      result = result.filter((p) => {
        if (typeof p.es_nuevo !== "undefined") return !!p.es_nuevo;

        // fallback: si hay fecha, consideramos últimos 30 días como nuevos
        if (p.created_at || p.creado_en) {
          const fecha = new Date(p.created_at || p.creado_en);
          const ahora = new Date();
          const diffDias =
            (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);
          return diffDias <= 30;
        }

        return true;
      });
    }

    // Rating mínimo (si hay campo)
    if (ratingAtLeast != null) {
      result = result.filter((p) => {
        const rating = Number(
          p.rating ?? p.valoracion ?? p.puntuacion ?? NaN
        );
        if (Number.isNaN(rating)) return true; // si no hay rating, no lo excluimos
        return rating >= ratingAtLeast;
      });
    }

    // Orden
    const getPrice = (p) => Number(p.precio ?? p.price ?? 0) || 0;
    const getRating = (p) =>
      Number(p.rating ?? p.valoracion ?? p.puntuacion ?? 0) || 0;

    if (sortBy === "price-low") {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === "rating") {
      result.sort((a, b) => getRating(b) - getRating(a));
    } else if (sortBy === "newest") {
      // si no tienes fecha, usamos id como aproximación
      result.sort((a, b) => {
        const fa = new Date(a.created_at || a.creado_en || 0).getTime();
        const fb = new Date(b.created_at || b.creado_en || 0).getTime();
        if (fa && fb) return fb - fa;
        return (b.id || 0) - (a.id || 0);
      });
    }
    // "popular" deja el orden original del endpoint (más vendidos)

    return result;
  }, [items, filters]);

  const count = filteredItems.length;

  return (
    <section
      ref={ref}
      className="bg-gradient-to-b from-black via-purple-900/100 to-black py-0 sm:py-0"
    >
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6">
        {/* === ENCABEZADO === */}
        <header className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-4 animate-flame-flicker">
            <Flame className="h-7 w-7 flame-anim" />
            <h2 className="text-3xl md:text-4xl text-white">Más Vendidos</h2>
          </div>

        <p className="text-gray-400 text-sm sm:text-base">
            Los productos favoritos de nuestra comunidad kawaii 💕
          </p>
        </header>

        {/* === Filtros + grilla === */}
        <div className="grid gap-8 lg:grid-cols-[290px,1fr] items-start">
          {/* aquí conectamos los filtros */}
          <ProductFilters onFiltersChange={setFilters} />

          <div className="space-y-4">
            {/* Contador */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-purple-100/80 px-1">
              <span>
                Mostrando{" "}
                <span className="font-semibold text-fuchsia-300">
                  {count}
                </span>{" "}
                productos
              </span>
            </div>

            {/* Contenido */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : count === 0 ? (
              <div className="min-h-[180px] flex items-center justify-center rounded-3xl border-2 border-dashed border-fuchsia-500/40 bg-black/40 text-purple-100/70 text-sm text-center px-6">
                Sin productos para los filtros seleccionados.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                {filteredItems.map((p) => (
                  <ProductCard
                    key={p.id || p.producto_id}
                    producto={p}
                    onAddedToCart={onAddedToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === BOTÓN VER MÁS (link a /catalogo) === */}
        <div className="mt-12 text-center">
          <Link
            to="/catalogo"
            className="
              bg-gradient-to-r from-fuchsia-600 to-pink-600
              hover:from-fuchsia-700 hover:to-pink-700
              text-white px-8 py-4 rounded-full shadow-lg
              hover:shadow-xl hover:shadow-fuchsia-500/50
              hover:scale-105 transition-all duration-300
              border-2 border-white/10
              inline-flex items-center justify-center
            "
          >
            Ver Más Productos ✨
          </Link>
        </div>
      </div>

      {/* === EXPLORA CATEGORÍAS === */}
      <section className="mt-16 py-16 bg-gradient-to-b from-black via-purple-950 to-black">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl text-center text-white mb-4">
            Explora por Categorías
          </h2>

          <p className="text-center text-gray-400 mb-12">
            Encuentra exactamente lo que buscas 💕
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                name: "Peluches",
                emoji: "🧸",
                color: "from-fuchsia-600 to-pink-600",
              },
              {
                name: "Papelería",
                emoji: "✏️",
                color: "from-purple-600 to-fuchsia-600",
              },
              {
                name: "Accesorios",
                emoji: "👒",
                color: "from-pink-600 to-fuchsia-600",
              },
              {
                name: "Decoración",
                emoji: "🏡",
                color: "from-fuchsia-600 to-purple-600",
              },
              {
                name: "Tecnología",
                emoji: "🎧",
                color: "from-pink-600 to-purple-600",
              },
            ].map((c, i) => (
              <button
                key={i}
                className="
                  group relative overflow-hidden
                  bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 
                  backdrop-blur-sm border border-fuchsia-500/20 rounded-2xl p-6 
                  shadow-md hover:shadow-2xl hover:shadow-fuchsia-500/20 
                  hover:border-fuchsia-500/50 transition-all duration-300
                  hover:scale-105
                "
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-0 group-hover:opacity-20 transition-opacity`}
                ></div>

                <div className="relative text-center space-y-2">
                  <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">
                    {c.emoji}
                  </div>
                  <p className="text-white group-hover:text-fuchsia-400 transition-colors">
                    {c.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
