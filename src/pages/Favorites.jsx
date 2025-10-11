// src/pages/Favorites.jsx
import React, { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FavoritesContext } from "../context/FavoritesContext";
import { CartContext } from "../context/CartContext";
import { toast } from "react-toastify";
import { FaShoppingCart, FaBars } from "react-icons/fa";
import MobileMenu from "../components/MobileMenu";
import ImageZoom from "../components/ImageZoom";

// 🔗 Base del backend para imágenes
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// 🖼️ Helper para URL de imagen
function getImageSrc(item) {
  const raw =
    item?.imagen_url || item?.image || item?.imagen || item?.foto || item?.url_imagen;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  return `${API_BASE}/uploads/${raw}`;
}

// 🔢 Normaliza precios (soporta varios nombres de campo del backend)
function normalizePricing(p) {
  const current = Number(p.price ?? p.precio ?? p.precio_oferta ?? 0);
  const regularRaw =
    p.regular_price ?? p.precio_regular ?? p.precio_anterior ?? undefined;
  const regularNum = regularRaw != null ? Number(regularRaw) : undefined;

  const en_oferta =
    Boolean(p.en_oferta) && regularNum != null && regularNum > current;

  const regular_price = regularNum != null ? regularNum : current;
  const ahorro = Math.max(0, regular_price - current);
  const pct = regular_price > 0 ? Math.round((ahorro / regular_price) * 100) : 0;

  return { price: current, regular_price, en_oferta, ahorro, pct };
}

export default function Favorites() {
  const usuario_nombre = localStorage.getItem("usuario_nombre") || "Invitado";
  const navigate = useNavigate();

  const { favorites, removeFromFavorites } = useContext(FavoritesContext);

  const { addToCart, cartItems } = useContext(CartContext) || {
    addToCart: null,
    cartItems: [],
  };

  // ▶ estado del menú móvil
  const [menuOpen, setMenuOpen] = useState(false);

  // ▶ flag admin (ajústalo a tu esquema real)
  const isAdmin =
    localStorage.getItem("usuario_rol") === "admin" ||
    localStorage.getItem("usuario_is_admin") === "1";

  // ▶ Lightbox Zoom
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomSrc, setZoomSrc] = useState(null);
  const [zoomAlt, setZoomAlt] = useState("");

  // Contador carrito
  const cartCount = useMemo(
    () => (cartItems?.reduce?.((a, i) => a + (i?.quantity || 0), 0)) || 0,
    [cartItems]
  );

  // Agregar al carrito (oferta-aware)
  const handleAddToCart = (p) => {
    const { price, regular_price, en_oferta, ahorro, pct } = normalizePricing(p);
    const stock = Number(p.stock_actual ?? p.stock ?? 0);

    if (stock <= 0) {
      toast.warn("⛔ Sin stock disponible");
      return;
    }

    const item = {
      id: p.id,
      name: p.nombre ?? p.name,
      price,                 // precio actual (oferta si hay)
      offer_price: price,    // alias útil
      regular_price,         // precio antes
      en_oferta,             // bandera
      quantity: 1,
      imagen_url: p.imagen_url ?? p.image ?? p.imagen,
      stock_actual: stock,
    };

    if (addToCart) {
      addToCart(item);

      // ✅ Eventos globales para CartFab/MiniCart (CartLayout)
      window.dispatchEvent(new CustomEvent("cart:add", { detail: { amount: 1, item } }));
      window.dispatchEvent(new Event("cart:changed"));
      window.dispatchEvent(new Event("cart:open"));
      // compat heredada:
      window.dispatchEvent(new Event("minicart:open"));

      if (en_oferta && ahorro > 0) {
        toast.success(`🎉 ¡Oferta agregada! Ahorras S/ ${ahorro.toFixed(2)} (${pct}%)`);
      } else {
        toast.success("🛒 Agregado al carrito");
      }
    } else {
      toast.info("Configura CartContext.addToCart para usar esta acción");
    }
  };

  const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white">
      {/* Navbar sticky */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-purple-900/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 text-xs sm:text-sm font-medium transition shrink-0"
          >
            ← Tienda
          </button>

          {/* Título + chip nombre (centro) */}
          <div className="flex-1 text-center">
            <div className="text-base sm:text-xl font-extrabold leading-tight">
              💖 Favoritos
            </div>
            <div className="inline-flex mt-0.5 px-2 py-0.5 rounded-full bg-white/15 text-[11px] sm:text-xs font-semibold text-white/90">
              {usuario_nombre}
            </div>
          </div>

          <button
            type="button"
            aria-label="Menú"
            className="text-white/90 p-2 rounded-full hover:bg-white/10 shrink-0"
            onClick={() => setMenuOpen(true)}
          >
            <FaBars />
          </button>
        </div>
      </nav>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-4 sm:pt-6">
        {favorites.length === 0 ? (
          <div className="min-h-[50vh] grid place-items-center">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center max-w-md">
              <div className="text-5xl mb-2">💔</div>
              <h2 className="text-xl font-semibold">Aún no tienes favoritos</h2>
              <p className="text-purple-200 mt-2">
                Marca productos como favoritos para verlos aquí.
              </p>
              <button
                onClick={() => navigate("/")}
                className="inline-block mt-6 bg-pink-500 hover:bg-pink-600 rounded-full px-6 py-3 font-semibold"
              >
                Ver productos
              </button>
            </div>
          </div>
        ) : (
          <div
            className="
              grid gap-3 sm:gap-4 md:gap-5
              grid-cols-2
              md:grid-cols-3
              xl:grid-cols-4
            "
          >
            {favorites.map((p) => {
              const name = p.nombre || p.name || "Producto";
              const img = getImageSrc(p);
              const sinStock =
                p.stock_actual !== undefined && Number(p.stock_actual) <= 0;

              const { price, regular_price, en_oferta, ahorro, pct } = normalizePricing(p);

              return (
                <article
                  key={p.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-purple-200/60 hover:shadow-md transition flex flex-col"
                >
                  {/* Imagen 4:3 compacta */}
                  <div className="relative w-full" style={{ paddingTop: "75%" }}>
                    {img ? (
                      <img
                        src={img}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover object-center cursor-zoom-in"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                        onClick={() => {
                          setZoomSrc(img);
                          setZoomAlt(name);
                          setZoomOpen(true);
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-3xl text-purple-300 bg-purple-50">
                        {p.emoji || "🛍️"}
                      </div>
                    )}

                    {/* Badge oferta -% */}
                    {en_oferta && pct > 0 && !sinStock && (
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow">
                        -{pct}%
                      </span>
                    )}

                    {/* Quitar de favoritos */}
                    <button
                      onClick={() => removeFromFavorites(p.id)}
                      className="absolute top-2 right-2 bg-white/95 hover:bg-white text-pink-600 rounded-full px-2.5 py-1.5 shadow text-xs font-semibold"
                      title="Quitar de favoritos"
                      aria-label="Quitar de favoritos"
                    >
                      💔
                    </button>

                    {/* Badge stock */}
                    {sinStock && (
                      <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                        Sin stock
                      </span>
                    )}
                  </div>

                  {/* Info compacta */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-purple-900 text-[13px] sm:text-sm leading-snug line-clamp-2 min-h-[2.4rem]">
                      {name}
                    </h3>

                    {/* Bloque de precios oferta-aware */}
                    <div className="mt-1 text-[13px] sm:text-sm">
                      {en_oferta && regular_price > price ? (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span className="text-gray-500 line-through">{fmt(regular_price)}</span>
                            <span className="font-extrabold text-purple-900">{fmt(price)}</span>
                          </div>
                          <div className="text-emerald-600 font-semibold text-[12px] sm:text[13px] mt-0.5">
                            Ahorras {fmt(ahorro)} ({pct}%)
                          </div>
                        </>
                      ) : (
                        <div className="text-purple-700">
                          Precio: <span className="font-bold">{fmt(price)}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-1.5 text-[13px] font-medium shadow hover:shadow-md transition disabled:opacity-60"
                        disabled={sinStock}
                        title="Agregar al carrito"
                      >
                        <FaShoppingCart className="text-[12px]" />
                        Agregar
                      </button>

                      <button
                        onClick={() => removeFromFavorites(p.id)}
                        className="rounded-full border border-pink-300 text-pink-600 hover:bg-pink-50 px-3 py-1.5 text-[13px] font-medium"
                        title="Quitar de favoritos"
                      >
                        💔
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ⛔️ Eliminado: <MiniCart .../> — lo renderiza CartLayout globalmente */}

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        usuarioNombre={usuario_nombre}
        favCount={favorites.length}
        cartCount={cartCount}
        isAdmin={isAdmin}
      />

      {/* Lightbox Zoom */}
      <ImageZoom
        isOpen={zoomOpen}
        src={zoomSrc}
        alt={zoomAlt}
        onClose={() => setZoomOpen(false)}
        info={{
          name: zoomAlt || "Producto",
          // si tienes estos datos en favoritos, puedes añadirlos:
          // price: favoritoSeleccionado?.precio_oferta ?? favoritoSeleccionado?.precio,
          // description: favoritoSeleccionado?.descripcion,
        }}
      />
    </div>
  );
}
