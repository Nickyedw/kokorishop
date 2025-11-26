// src/components/ProductCard.jsx
import React, {
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";

import { CartContext } from "../context/CartContext";
import { FavoritesContext } from "../context/FavoritesContext";
import { toast } from "react-toastify";

import QuickViewModal from "./QuickViewModal";

import {
  Heart,
  ShoppingCart,
  Eye,
  Star,
  Sparkles,
} from "lucide-react";

const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_BASE = `${API_APP}/api`;
const FALLBACK_IMG = "/img/no-image.png";

// Helpers para URL de imagen
const isAbsoluteFsPath = (s) => /[A-Za-z]:[\\/]/.test(s || "");
const pickUrl = (raw) =>
  typeof raw === "object" && raw !== null ? raw.url : raw;

function toFullUrl(raw) {
  const v = pickUrl(raw);
  if (typeof v !== "string" || v.trim() === "" || isAbsoluteFsPath(v)) {
    return FALLBACK_IMG;
  }

  const s0 = v.replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s0)) return s0;

  const upIdx = s0.toLowerCase().indexOf("/uploads/");
  if (upIdx >= 0) return `${API_APP}${s0.slice(upIdx)}`;

  if (s0.startsWith("/")) return `${API_APP}${s0}`;
  return `${API_APP}/${s0}`;
}

// Normalización de precios (soporta varios nombres de campos)
function normalizePricing(p) {
  const current = Number(
    p.price ?? p.precio ?? p.precio_oferta ?? 0
  );

  const regularRaw =
    p.regular_price ??
    p.precio_regular ??
    p.precio_anterior ??
    undefined;

  const regularNum = regularRaw != null ? Number(regularRaw) : undefined;

  const en_oferta =
    Boolean(p.en_oferta) &&
    regularNum != null &&
    regularNum > current;

  const regular_price = regularNum != null ? regularNum : current;
  const ahorro = Math.max(0, regular_price - current);
  const pct =
    regular_price > 0
      ? Math.round((ahorro / regular_price) * 100)
      : 0;

  return {
    price: current,
    offer_price: current,
    regular_price,
    en_oferta,
    ahorro,
    pct,
  };
}

export default function ProductCard({ producto, onAddedToCart }) {
  const { addToCart } = useContext(CartContext);
  const { isFavorite, addToFavorites, removeFromFavorites } =
    useContext(FavoritesContext);

  // ========= Galería ordenada =========
  const galeriaOrdenada = useMemo(() => {
    const galeria = Array.isArray(producto.imagenes)
      ? producto.imagenes
      : [];

    const arr = [...galeria].sort((a, b) => {
      const ap = a?.es_principal ? 1 : 0;
      const bp = b?.es_principal ? 1 : 0;
      if (ap !== bp) return bp - ap;

      const ao = Number(a?.orden ?? 0);
      const bo = Number(b?.orden ?? 0);
      if (ao !== bo) return ao - bo;

      return Number(a?.id ?? 0) - Number(b?.id ?? 0);
    });

    const seen = new Set();
    return arr.filter((x) => {
      const u = pickUrl(x);
      if (!u || seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  }, [producto.imagenes]);

  // Imagen principal
  const principalRaw = producto.imagen_url ?? null;
  const imageUrl = toFullUrl(principalRaw);

  // Precios
  const { price, regular_price, en_oferta, ahorro, pct } =
    normalizePricing(producto);

  // Stock
  const stock_actual = Number(
    producto.stock_actual ?? producto.stock ?? 0
  );
  const stock_minimo = Number(producto.stock_minimo ?? 0);
  const sinStock = stock_actual <= 0;
  const stockBajo =
    !sinStock && stock_minimo > 0 && stock_actual <= stock_minimo;

  // Flags
  const isNew =
    producto.es_nuevo ?? producto.isNew ?? false;

  const discount = en_oferta && pct > 0 ? pct : null;

  const rating = Number(
    producto.rating ?? producto.calificacion_promedio ?? 4.8
  );
  const reviews = Number(
    producto.reviews ?? producto.total_resenas ?? 120
  );

  // Quick View (modal estilo Figma)
  const [quickOpen, setQuickOpen] = useState(false);

  // Galería para el QuickView
  const quickImages = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (u) => {
      if (!u) return;
      const p = toFullUrl(u);
      if (p && !seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    };

    // principal + galería
    push(principalRaw);
    for (const g of galeriaOrdenada) push(pickUrl(g));

    return out.length ? out : [FALLBACK_IMG];
  }, [principalRaw, galeriaOrdenada]);

  // Favoritos
  const handleFavoriteToggle = () => {
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id);
    } else {
      addToFavorites(producto);
    }
  };

  // Agregar al carrito (recibe cantidad desde el QuickView si hace falta)
  const handleAdd = (qty = 1) => {
    const quantity = Math.max(1, Number(qty) || 1);

    addToCart({
      id: producto.id,
      name: producto.nombre,
      price,
      offer_price: price,
      regular_price,
      en_oferta,
      quantity,
      imagen_url: principalRaw,
      stock_actual,
    });

    if (en_oferta && ahorro > 0) {
      toast.success(
        `🎉 ¡Oferta agregada! Ahorras S/ ${ahorro.toFixed(
          2
        )} (${pct}%)`
      );
    } else {
      toast.success("🛒 Agregado al carrito");
    }

    onAddedToCart?.();
  };

  // Notificación de stock bajo
  useEffect(() => {
    if (!stockBajo) return;

    const key = `stockAlertSent:${producto.id}:${stock_actual}`;
    if (localStorage.getItem(key) === "1") return;

    (async () => {
      try {
        await fetch(`${API_BASE}/notificaciones/stock-bajo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            producto_id: producto.id,
            nombreProducto: producto.nombre,
            stock_actual,
            stock_minimo,
          }),
        });

        localStorage.setItem(key, "1");
      } catch {
        // silencioso
      }
    })();
  }, [stockBajo, producto.id, producto.nombre, stock_actual, stock_minimo]);

  // ========== RENDER — ESTILO FIGMA ==========

  return (
    <>
      <div
        className="
          group relative
          bg-gradient-to-br from-purple-950 to-fuchsia-950
          rounded-2xl shadow-md hover:shadow-2xl hover:shadow-fuchsia-500/20
          transition-all duration-300 overflow-hidden
          border-2 border-fuchsia-500/20 hover:border-fuchsia-500/50
        "
      >
        {/* Badges esquina superior izquierda */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {isNew && (
            <span
              className="
                inline-flex items-center justify-center
                px-2 py-1 text-xs rounded-full
                bg-gradient-to-r from-fuchsia-600 to-pink-500
                text-white border-2 border-black shadow-lg
              "
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Nuevo
            </span>
          )}

          {discount && !sinStock && (
            <span
              className="
                inline-flex items-center justify-center
                px-2 py-1 text-xs rounded-full
                bg-gradient-to-r from-pink-600 to-fuchsia-600
                text-white border-2 border-black shadow-lg
              "
            >
              -{discount}%
            </span>
          )}

          {sinStock && (
            <span
              className="
                inline-flex items-center justify-center
                px-2 py-1 text-xs rounded-full
                bg-gray-900 text-white border-2 border-black shadow-lg
              "
            >
              Agotado
            </span>
          )}

          {!sinStock && stockBajo && (
            <span
              className="
                inline-flex items-center justify-center
                px-2 py-1 text-[11px] rounded-full
                bg-amber-300 text-black border-2 border-black
                shadow-lg font-semibold
              "
              title={`Stock mínimo: ${stock_minimo}`}
            >
              Stock bajo
            </span>
          )}
        </div>

        {/* Botón favoritos */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          className="
            absolute top-3 right-3 z-20
            bg-black/80 backdrop-blur-sm rounded-full p-2
            shadow-lg hover:scale-110
            transition-transform border border-fuchsia-500/30
          "
          aria-label="Agregar a favoritos"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite(producto.id)
                ? "fill-fuchsia-500 text-fuchsia-500"
                : "text-gray-400"
            } transition-colors`}
          />
        </button>

        {/* Imagen + overlay Quick View */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-black to-purple-900">
          <img
            src={imageUrl}
            alt={producto.nombre}
            className="
              w-full h-full object-cover
              transition-transform duration-500
              group-hover:scale-110
            "
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
            loading="lazy"
            decoding="async"
            onClick={() => setQuickOpen(true)} // abre QuickViewModal
          />

          {/* Overlay Vista Rápida */}
          <div
            className="
              absolute inset-0 bg-black/40 backdrop-blur-sm
              flex items-center justify-center
              transition-opacity duration-300
              opacity-0 group-hover:opacity-100
              pointer-events-none group-hover:pointer-events-auto
            "
          >
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="
                inline-flex items-center px-4 py-2 text-sm
                bg-gradient-to-r from-fuchsia-600 to-pink-500
                text-white rounded-full shadow-xl
                hover:from-fuchsia-700 hover:to-pink-600
                transform hover:scale-105
                transition-all border-2 border-white/20
              "
            >
              <Eye className="h-4 w-4 mr-2" />
              Vista Rápida
            </button>
          </div>
        </div>

        {/* Información del producto */}
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* Rating */}
          <div className="flex items-center gap-1 md:gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 md:h-4 md:w-4 ${
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs md:text-sm text-gray-400">
              {rating.toFixed(1)}{" "}
              <span className="text-gray-500">
                ({reviews})
              </span>
            </span>
          </div>

          {/* Nombre */}
          <h3
            className="
              text-white text-sm md:text-base
              line-clamp-2
              min-h-[2.5rem] md:min-h-[3rem]
              group-hover:text-fuchsia-400
              transition-colors
            "
            title={producto.nombre}
          >
            {producto.nombre}
          </h3>

          {/* Descripción corta (solo desktop, como en Figma) */}
          {producto.descripcion && (
            <p
              className="
                text-xs md:text-sm text-gray-400
                line-clamp-2
                min-h-[2rem] md:min-h-[2.5rem]
                hidden md:block
              "
            >
              {producto.descripcion}
            </p>
          )}

          {/* Precios */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl text-fuchsia-400">
              S/ {price.toFixed(2)}
            </span>
            {en_oferta && regular_price > price && (
              <span className="text-xs md:text-sm text-gray-500 line-through">
                S/ {regular_price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Botón agregar al carrito */}
          <button
            type="button"
            onClick={() => handleAdd(1)}
            disabled={sinStock}
            className={`
              w-full inline-flex items-center justify-center
              bg-gradient-to-r from-fuchsia-600 to-pink-600
              hover:from-fuchsia-700 hover:to-pink-700
              text-white shadow-lg hover:shadow-xl hover:shadow-fuchsia-500/50
              rounded-full border-2 border-white/10
              text-xs md:text-sm py-3 md:py-4
              transform transition-all duration-300
              ${
                sinStock
                  ? "opacity-60 cursor-not-allowed hover:scale-100"
                  : "hover:scale-105"
              }
            `}
            title={
              sinStock
                ? "Sin stock disponible"
                : "Agregar al carrito"
            }
          >
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">
              {sinStock ? "No disponible" : "Agregar al Carrito"}
            </span>
            <span className="sm:hidden">
              {sinStock ? "Agotado" : "Agregar"}
            </span>
          </button>
        </div>
      </div>

      {/* QUICK VIEW MODAL (reemplaza al ImageZoom antiguo) */}
      <QuickViewModal
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        producto={producto}
        images={quickImages}
        price={price}
        regularPrice={regular_price}
        discount={discount}
        inStock={!sinStock}
        onAddToCart={handleAdd}
        onToggleFavorite={handleFavoriteToggle}
        isFavorite={isFavorite(producto.id)}
      />
    </>
  );
}
