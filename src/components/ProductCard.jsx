// src/components/ProductCard.jsx
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { toast } from 'react-toastify';
import ImageZoom from './ImageZoom';

const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_APP}/api`;
const FALLBACK_IMG = '/img/no-image.png';

// Helpers
const isAbsoluteFsPath = (s) => /[A-Za-z]:[\\/]/.test(s || ''); // C:\ o D:/
const pickUrl = (raw) => (typeof raw === 'object' && raw !== null ? raw.url : raw);

/** Acepta string, objeto {url}, null/undefined y devuelve URL lista (o fallback) */
function toFullUrl(raw) {
  const v = pickUrl(raw);
  if (typeof v !== 'string' || v.trim() === '' || isAbsoluteFsPath(v)) return FALLBACK_IMG;

  const s0 = v.replace(/\\/g, '/');

  if (/^https?:\/\//i.test(s0)) return s0;
  const upIdx = s0.toLowerCase().indexOf('/uploads/');
  if (upIdx >= 0) return `${API_APP}${s0.slice(upIdx)}`;
  if (s0.startsWith('/')) return `${API_APP}${s0}`;
  return `${API_APP}/${s0}`;
}

/** Normaliza precios para soportar distintos nombres de campos del backend */
function normalizePricing(p) {
  const current = Number(p.price ?? p.precio ?? p.precio_oferta ?? 0);

  const regularRaw =
    p.regular_price ??
    p.precio_regular ??
    p.precio_anterior ??
    undefined;

  const regularNum = regularRaw != null ? Number(regularRaw) : undefined;

  const en_oferta =
    Boolean(p.en_oferta) && regularNum != null && regularNum > current;

  const regular_price = regularNum != null ? regularNum : current;
  const ahorro = Math.max(0, regular_price - current);
  const pct = regular_price > 0 ? Math.round((ahorro / regular_price) * 100) : 0;

  return { price: current, offer_price: current, regular_price, en_oferta, ahorro, pct };
}

const ProductCard = ({ producto, onAddedToCart }) => {
  const { addToCart } = useContext(CartContext);
  const { isFavorite, addToFavorites, removeFromFavorites } = useContext(FavoritesContext);

  // Galería ordenada (para el zoom)
  const galeriaOrdenada = useMemo(() => {
    const galeria = Array.isArray(producto.imagenes) ? producto.imagenes : [];
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

  // Thumbnail SIEMPRE es la principal
  const principalRaw = producto.imagen_url ?? null;
  const imageUrl = toFullUrl(principalRaw);

  // pricing
  const { price, regular_price, en_oferta, ahorro, pct } = normalizePricing(producto);

  const stock_actual = Number(producto.stock_actual ?? producto.stock ?? 0);
  const stock_minimo = Number(producto.stock_minimo ?? 0);
  const sinStock = stock_actual <= 0;

  // 🔔 Stock bajo (hay stock, pero ≤ mínimo)
  const stockBajo = !sinStock && stock_minimo > 0 && stock_actual <= stock_minimo;

  const [zoomOpen, setZoomOpen] = useState(false);

  const handleFavoriteToggle = () => {
    if (isFavorite(producto.id)) removeFromFavorites(producto.id);
    else addToFavorites(producto);
  };

  const handleAdd = () => {
    const chosen = principalRaw ?? pickUrl(galeriaOrdenada[0]) ?? null;

    addToCart({
      id: producto.id,
      name: producto.nombre,
      price,
      offer_price: price,
      regular_price,
      en_oferta,
      quantity: 1,
      imagen_url: chosen,
      stock_actual,
    });

    if (en_oferta && ahorro > 0) {
      toast.success(`🎉 ¡Oferta agregada! Ahorras S/ ${ahorro.toFixed(2)} (${pct}%)`);
    } else {
      toast.success('🛒 Agregado al carrito');
    }

    onAddedToCart?.();
  };

  // Lista de URLs para el Zoom: [principal, ...galería] sin duplicados
  const zoomImages = useMemo(() => {
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
    push(principalRaw);
    for (const g of galeriaOrdenada) push(pickUrl(g));
    return out.length ? out : [FALLBACK_IMG];
  }, [principalRaw, galeriaOrdenada]);

  // ⚠️ Enviar alerta de stock bajo al backend (una vez por sesión y por valor de stock)
  useEffect(() => {
    if (!stockBajo) return;

    const key = `stockAlertSent:${producto.id}:${stock_actual}`;
    if (localStorage.getItem(key) === '1') return;

    (async () => {
      try {
        await fetch(`${API_BASE}/notificaciones/stock-bajo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            producto_id: producto.id,
            nombreProducto: producto.nombre,
            stock_actual,
            stock_minimo,
          }),
        });
        localStorage.setItem(key, '1');
      } catch {
        // Silencioso: no romper UI si falla notificación
      }
    })();
  }, [stockBajo, producto.id, producto.nombre, stock_actual, stock_minimo]);

  return (
    <div
      className="
        group bg-white text-purple-800 rounded-xl sm:rounded-2xl
        p-3 sm:p-4 md:p-5 text-center shadow-md hover:shadow-lg transition
        relative
      "
    >
      {/* Imagen */}
      <div className="relative mb-2 sm:mb-3">
        <img
          src={imageUrl}
          alt={producto.nombre}
          className="
            w-full
            h-32 sm:h-36 md:h-40 lg:h-44
            object-contain rounded-md
            cursor-zoom-in
          "
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
          onClick={() => setZoomOpen(true)}
          loading="lazy"
          decoding="async"
        />

        {/* 🔴 Sin stock */}
        {sinStock && (
          <span
            className="
              absolute top-2 left-2
              bg-red-500 text-white
              text-[10px] sm:text-xs font-bold
              px-2 py-1 rounded-full
            "
          >
            Sin stock
          </span>
        )}

        {/* 🟡 Stock bajo */}
        {!sinStock && stockBajo && (
          <span
            className="
              absolute top-2 left-2
              bg-amber-400 text-black
              text-[10px] sm:text-xs font-extrabold
              px-2 py-1 rounded-full shadow
            "
            title={`Stock mínimo: ${stock_minimo}`}
          >
            Stock bajo
          </span>
        )}

        {/* Badge de descuento */}
        {en_oferta && pct > 0 && !sinStock && (
          <span
            className="
              absolute top-2 right-2
              px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white
              bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow
            "
            aria-label={`-${pct}%`}
          >
            -{pct}%
          </span>
        )}
      </div>

      {/* Nombre */}
      <p
        className="
          font-semibold text-purple-900 leading-tight
          text-sm sm:text-base md:text-lg
          mb-1 line-clamp-2
        "
        title={producto.nombre}
      >
        {producto.nombre}
      </p>

      {/* Descripción (opcional) */}
      {producto.descripcion && (
        <p
          className="
            text-gray-600
            text-[11px] sm:text-xs md:text-sm
            mb-1 line-clamp-2
          "
          title={producto.descripcion}
        >
          {producto.descripcion}
        </p>
      )}

      {/* Precio */}
      <div className="mb-2 md:mb-3">
        {en_oferta && regular_price > price ? (
          <>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-gray-500 line-through text-xs sm:text-sm">
                S/ {regular_price.toFixed(2)}
              </span>
              <span className="font-extrabold text-purple-900 text-sm sm:text-base md:text-lg">
                S/ {price.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-600 font-semibold mt-1">
              Ahorras S/ {ahorro.toFixed(2)} ({pct}%)
            </div>
          </>
        ) : (
          <p className="font-extrabold text-purple-900 text-sm sm:text-base md:text-lg">
            S/ {price.toFixed(2)}
          </p>
        )}
      </div>

      {/* Botón Agregar */}
      <button
        onClick={handleAdd}
        disabled={sinStock}
        className="
          bg-purple-600 hover:bg-purple-700
          disabled:bg-purple-300 disabled:cursor-not-allowed
          text-white rounded-full shadow
          px-3 py-1 text-xs
          sm:px-4 sm:py-1.5 sm:text-sm
          md:px-5 md:py-2 md:text-base
        "
        title={sinStock ? 'Sin stock disponible' : 'Agregar al carrito'}
        aria-label="Agregar al carrito"
      >
        Agregar al carrito
      </button>

      {/* Favorito */}
      <button
        onClick={handleFavoriteToggle}
        className="
          absolute top-2 right-2
          text-pink-500
          text-lg sm:text-xl md:text-2xl
          hover:scale-110 transition-transform
        "
        title="Favorito"
        aria-label="Alternar favorito"
      >
        {isFavorite(producto.id) ? '💖' : '🤍'}
      </button>

      {/* Zoom */}
      <ImageZoom
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        images={zoomImages}
        alt={producto?.nombre || producto?.name || "Producto"}
        onAdd={!sinStock ? handleAdd : undefined}
        addLabel="Agregar"
        info={{
          name: producto?.nombre || producto?.name || "Producto",
          price: producto?.precio_oferta ?? producto?.precio ?? producto?.price ?? undefined,
          description: producto?.descripcion || producto?.description || "",
        }}
      />
    </div>
  );
};

export default ProductCard;
