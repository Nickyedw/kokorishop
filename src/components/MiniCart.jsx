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
 * MiniCart
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
    total,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useContext(CartContext) || {
    cartItems: [],
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

  return (
    <>
      {/* FAB flotante */}
      {trigger === "fab" && hasItems && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
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
                Subtotal: S/ {Number(total || 0).toFixed(2)}
              </span>
            </span>

            <FaChevronRight className="opacity-80 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      )}

      {/* Slide panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <aside
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl
                       flex flex-col animate-[slideIn_.25s_ease-out]"
            style={{ animation: "slideIn .25s ease-out" }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-purple-900">Tu carrito</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-purple-700 hover:text-purple-900 font-semibold"
                aria-label="Cerrar mini carrito"
              >
                ✕
              </button>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.map((it) => {
                const img = getImageSrc(it);
                return (
                  <div
                    key={it.id}
                    className="flex gap-3 border border-purple-100 rounded-xl p-3"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-purple-50 border border-purple-100 shrink-0">
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
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
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

                      <div className="mt-1 text-xs text-gray-500">
                        Precio:{" "}
                        <span className="font-semibold text-purple-800">
                          S/ {Number(it.price).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        {/* Stepper con número visible */}
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
                            S/ {(Number(it.price) * Number(it.quantity)).toFixed(2)}
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

            {/* Footer */}
            <div className="border-t border-gray-200 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold text-purple-900">
                  S/ {Number(total).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => clearCart()}
                  className="flex-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium"
                >
                  Vaciar
                </button>
                <button
                  onClick={() => {
                    navigate(cartPath);
                    setOpen(false);
                  }}
                  className="flex-1 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50 px-4 py-2 text-sm font-semibold"
                >
                  Ver carrito
                </button>
                <button
                  onClick={() => {
                    goPay();
                    setOpen(false);
                  }}
                  className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-2 text-sm font-semibold shadow hover:shadow-md"
                >
                  Pagar
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
