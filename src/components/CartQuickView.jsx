// src/components/CartQuickView.jsx
import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getImageSrc(item) {
  const raw =
    item?.imagen_url || item?.image || item?.imagen || item?.foto || item?.url_imagen;
  if (!raw) return `${import.meta.env.BASE_URL || "/"}img/no-image.png`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  return `${API_BASE}/uploads/${raw}`;
}

const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

export default function CartQuickView() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
  } = useContext(CartContext);

  const [open, setOpen] = useState(false);

  // Eventos para abrir/cerrar
  useEffect(() => {
    const openIt = () => setOpen(true);
    const closeIt = () => setOpen(false);
    window.addEventListener("cart:quick:open", openIt);
    window.addEventListener("cart:open", openIt);    // compat
    window.addEventListener("minicart:open", openIt); // compat
    window.addEventListener("cart:quick:close", closeIt);

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("cart:quick:open", openIt);
      window.removeEventListener("cart:open", openIt);
      window.removeEventListener("minicart:open", openIt);
      window.removeEventListener("cart:quick:close", closeIt);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end md:items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Sheet / Modal */}
      <div
        className="
          relative w-[94vw] md:w-[92vw] lg:w-[64rem]   /* 1024px en lg */
          max-w-[64rem] 
          max-h-[86vh]
          bg-white text-purple-900 rounded-t-3xl md:rounded-3xl shadow-2xl
          border border-purple-100 overflow-hidden
          translate-y-0
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 md:px-6 py-3 md:py-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg md:text-xl font-extrabold">Tu carrito</h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full w-9 h-9 grid place-items-center text-purple-500 hover:bg-purple-50"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cabecera de columnas (solo desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_36px] items-center gap-3 px-6 py-2 text-xs font-semibold text-purple-500/80 border-b">
          <div>Producto</div>
          <div className="text-right">Precio</div>
          <div className="text-center">Cant.</div>
          <div className="text-right">Subtotal</div>
          <div />
        </div>

        {/* Lista scrollable */}
        <div className="overflow-y-auto max-h-[56vh] md:max-h-[50vh] px-2 md:px-4">
          {cartItems.length === 0 && (
            <div className="p-6 text-center text-purple-500">Tu carrito está vacío.</div>
          )}

          {cartItems.map((it) => {
            const rowSubtotal = Number(it.price || 0) * Number(it.quantity || 1);
            return (
              <div
                key={it.id}
                className="
                  grid gap-3 items-center
                  px-2 md:px-2 py-3 md:py-4 border-b last:border-b-0
                  md:grid-cols-[1fr_auto_auto_auto_36px]
                  grid-cols-1
                "
              >
                {/* Producto + imagen */}
                <div className="flex items-center gap-3">
                  <img
                    src={getImageSrc(it)}
                    alt={it.name || "Producto"}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover bg-purple-50 border border-purple-100"
                    onError={(e) => {
                      e.currentTarget.src = `${import.meta.env.BASE_URL || "/"}img/no-image.png`;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm md:text-base line-clamp-2">
                      {it.name || "Producto"}
                    </div>
                    <div className="text-xs text-purple-500 mt-0.5 md:hidden">
                      Precio: <span className="font-medium">{fmt(it.price)}</span>
                    </div>
                  </div>
                </div>

                {/* Precio (desktop) */}
                <div className="hidden md:block text-right text-sm">{fmt(it.price)}</div>

                {/* Cantidad */}
                <div className="flex md:justify-center items-center gap-2">
                  <button
                    className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700"
                    onClick={() => decreaseQuantity(it.id)}
                    aria-label="Disminuir"
                  >
                    −
                  </button>
                  <div className="min-w-[2rem] text-center font-semibold">{it.quantity}</div>
                  <button
                    className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700"
                    onClick={() => increaseQuantity(it.id)}
                    aria-label="Aumentar"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right font-semibold">{fmt(rowSubtotal)}</div>

                {/* Eliminar */}
                <div className="flex justify-end">
                  <button
                    className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600"
                    onClick={() => removeFromCart(it.id)}
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur px-4 md:px-6 py-3 md:py-4 border-t">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-base md:text-lg font-extrabold">
              Subtotal <span className="text-purple-700 ml-2">{fmt(subtotal)}</span>
            </div>

            <div className="flex gap-2 md:gap-3">
              <a
                href="/Cart"
                className="inline-flex items-center justify-center rounded-full px-5 h-10 md:h-11 text-sm md:text-base bg-purple-50 hover:bg-purple-100 text-purple-700"
              >
                Ir al carrito
              </a>
              <a
                href="/Cart?pay=1"
                className="inline-flex items-center justify-center rounded-full px-6 h-10 md:h-11 text-sm md:text-base
                  bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-semibold shadow-md active:scale-[.98] transition"
              >
                Pagar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
