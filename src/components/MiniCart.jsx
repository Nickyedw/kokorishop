// src/components/MiniCart.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FaShoppingCart, FaChevronRight } from "react-icons/fa";

// Helper local para URL de imágenes
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
function getImageSrc(item) {
  const raw =
    item?.imagen_url || item?.image || item?.imagen || item?.foto || item?.url_imagen;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  return `${API_BASE}/uploads/${raw}`;
}

/**
 * MiniCart responsive
 *
 * Props:
 * - cartPath (string): ruta del carrito. Default: "/Cart"
 * - openOnEvent (boolean): si true, escucha window "minicart:open" para abrir. Default: true
 * - trigger ( "fab" | "none" ): muestra botón flotante (fab) o no. Default: "fab"
 * - checkoutMode ("query" | "cart"): "query" navega a cartPath+"?checkout=1", "cart" solo abre carrito. Default: "query"
 */
export default function MiniCart({
  cartPath = "/Cart",
  openOnEvent = true,
  trigger = "fab",
  checkoutMode = "query",
}) {
  const navigate = useNavigate();

  const {
    cartItems,
    // totales oferta-aware
    subtotal,
    regularSubtotal,
    savingsTotal,
    savingsPct,
    total, // compat
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useContext(CartContext) || {
    cartItems: [],
    subtotal: 0,
    regularSubtotal: 0,
    savingsTotal: 0,
    savingsPct: 0,
    total: 0,
    removeFromCart: () => {},
    increaseQuantity: () => {},
    decreaseQuantity: () => {},
    clearCart: () => {},
  };

  const [open, setOpen] = useState(false);

  // Abrir por evento global (útil cuando agregas al carrito y quieres mostrarlo)
  useEffect(() => {
    if (!openOnEvent) return;
    const handler = () => setOpen(true);
    window.addEventListener("minicart:open", handler);
    return () => window.removeEventListener("minicart:open", handler);
  }, [openOnEvent]);

  const hasItems = useMemo(() => (cartItems?.length || 0) > 0, [cartItems]);

  const goPay = () => {
    if (checkoutMode === "query") navigate(`${cartPath}?checkout=1`);
    else navigate(cartPath);
  };

  const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

  return (
    <>
      {/* FAB flotante */}
      {trigger === "fab" && hasItems && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[100]">
          <button
            onClick={() => setOpen(true)}
            className="group w-auto flex items-center gap-3 rounded-full shadow-xl
                       bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white
                       pl-4 pr-5 py-3 hover:from-purple-500 hover:to-fuchsia-500
                       transition active:scale-[0.98]"
            aria-label="Ver carrito"
            title="Abrir mini carrito"
          >
            <span className="relative inline-flex items-center justify-center">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-white/15">
                <FaShoppingCart className="text-white" />
              </span>
              <span className="absolute -top-2 -right-2 bg-white text-purple-700 text-xs font-extrabold px-2 py-0.5 rounded-full shadow">
                {cartItems.length}
              </span>
            </span>

            <span className="text-sm font-semibold leading-none">
              Ver carrito
              <span className="block text-[11px] font-normal opacity-90 mt-0.5">
                Subtotal: {fmt(subtotal ?? total)}
              </span>
            </span>

            <FaChevronRight className="opacity-80 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      )}

      {/* Overlay + Drawer responsive */}
      <div className={`fixed inset-0 z-[99] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'} 
                      bg-black/25 sm:bg-black/40 backdrop-blur-[1px]`}
          onClick={() => setOpen(false)}
        />

        {/* Panel / Drawer */}
        <aside
          role="dialog"
          aria-modal="true"
          className={`
            absolute
            /* ✨ En móvil: tarjeta flotante con margen visual */
            top-[11.5vh] right-[0vw] h-[80vh] w-[80vw]
            /* ✨ En desktop: panel lateral completo */
            sm:top-0 sm:right-0 sm:h-screen sm:w-[420px]
            max-w-[480px]
            bg-white text-purple-900
            rounded-2xl sm:rounded-none sm:rounded-l-2xl
            shadow-2xl
            transition-transform duration-300 will-change-transform
            ${open ? 'translate-x-0' : 'translate-x-full'}
            flex flex-col
          `}
        >

          {/* HEADER sticky */}
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-5 py-4 flex items-center justify-between rounded-t-2xl sm:rounded-none">
            <h3 className="text-lg sm:text-xl font-semibold">Tu carrito</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-purple-700 hover:text-purple-900 font-semibold text-xl leading-none"
              aria-label="Cerrar mini carrito"
              title="Cerrar"
            >
              ×
            </button>
          </header>

          {/* LISTA scrollable */}
          <div className="overflow-y-auto px-4 py-3 max-h-[calc(92vh-148px)] sm:max-h-[calc(100vh-148px)]">
            {cartItems.map((it) => {
              const img = getImageSrc(it);
              const isOffer =
                !!it.en_oferta &&
                Number(it.regular_price ?? 0) > Number(it.price ?? 0);
              const pct = isOffer
                ? Math.round(
                    ((Number(it.regular_price) - Number(it.price)) /
                      Number(it.regular_price)) * 100
                  )
                : 0;

              return (
                <div
                  key={it.id}
                  className="flex gap-3 border border-purple-100 rounded-xl p-3 mb-3 last:mb-0"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-purple-50 border border-purple-100 shrink-0">
                    {img ? (
                      <img
                        src={img}
                        alt={it.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-2xl text-purple-300">
                        🛍️
                      </div>
                    )}
                    {/* badge -% */}
                    {isOffer && pct > 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow">
                        -{pct}%
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-purple-900 line-clamp-2">
                        {it.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(it.id)}
                        className="text-red-500/80 hover:text-red-600 text-xs"
                        aria-label="Eliminar del carrito"
                      >
                        Eliminar
                      </button>
                    </div>

                    {/* precio unitario (tachado si oferta) */}
                    <div className="mt-1 text-xs text-gray-500 flex items-baseline gap-2">
                      <span>Precio:</span>
                      {isOffer ? (
                        <>
                          <span className="line-through text-gray-400">
                            {fmt(it.regular_price)}
                          </span>
                          <span className="font-semibold text-purple-800">
                            {fmt(it.price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-purple-800">
                          {fmt(it.price)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {/* Stepper */}
                      <div className="inline-flex items-center rounded-full border border-purple-200 overflow-hidden">
                        <button
                          onClick={() => decreaseQuantity(it.id)}
                          className="px-2 py-1 text-purple-700 hover:bg-purple-50 disabled:opacity-40"
                          disabled={Number(it.quantity) <= 1}
                        >
                          –
                        </button>
                        <span className="px-2 py-1 text-sm font-semibold min-w-[2ch] text-center text-purple-900">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(it.id)}
                          className="px-2 py-1 text-purple-700 hover:bg-purple-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="ml-auto text-sm">
                        <span className="text-gray-500 mr-1">Total:</span>
                        <span className="font-bold text-purple-900">
                          {fmt(Number(it.price) * Number(it.quantity))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {cartItems.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                Tu carrito está vacío.
              </div>
            )}
          </div>

          {/* FOOTER sticky */}
          <footer
            className="sticky bottom-0 z-10 bg-white/90 backdrop-blur border-t px-5 py-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" }}
          >
            {/* “Antes” y ahorro si aplica */}
            {regularSubtotal > subtotal && (
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-600">Antes</span>
                <span className="text-gray-400 line-through">{fmt(regularSubtotal)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-bold text-purple-900">{fmt(subtotal ?? total)}</span>
            </div>

            {regularSubtotal > subtotal && (
              <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-600 font-semibold mt-1">
                <span>Ahorras</span>
                <span>
                  {fmt(savingsTotal)} ({savingsPct}%)
                </span>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => clearCart()}
                className="flex-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm sm:text-base"
              >
                Vaciar
              </button>
              <button
                onClick={() => {
                  navigate(cartPath);
                  setOpen(false);
                }}
                className="flex-1 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50 px-4 py-2 text-sm sm:text-base"
              >
                Ver carrito
              </button>
              <button
                onClick={() => {
                  goPay();
                  setOpen(false);
                }}
                className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-4 py-2 text-sm sm:text-base shadow"
              >
                Pagar
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </>
  );
}
