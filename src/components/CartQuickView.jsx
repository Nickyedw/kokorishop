// src/components/CartQuickView.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useContext } from "react";

const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";

function imgSrc(it) {
  const raw = it.imagen_url || it.image || it.imagen || "";
  if (!raw) return "/img/no-image.png";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_APP}${raw}`;
  return `${API_APP}/uploads/${raw}`;
}

export default function CartQuickView() {
  const navigate = useNavigate();
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
  } = useContext(CartContext) || {};

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener("cart:quick:open", onOpen);
    window.addEventListener("cart:quick:close", onClose);
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("cart:quick:open", onOpen);
      window.removeEventListener("cart:quick:close", onClose);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  if (!open) return null;

  const goCart = () => {
    setOpen(false);
    navigate("/Cart", { replace: false });
  };
  const goPay = () => {
    setOpen(false);
    navigate("/Cart?checkout=1", { replace: false });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Sheet */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[95%] max-w-md
                      bg-white rounded-t-3xl shadow-2xl border border-purple-200
                      overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-purple-900 font-semibold">Tu carrito</h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full px-2 py-1 hover:bg-gray-100"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-3">
          {(cartItems || []).length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aún no agregaste productos.
            </p>
          ) : (
            <ul className="space-y-3">
              {cartItems.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 border rounded-xl p-2"
                >
                  <img
                    src={imgSrc(it)}
                    alt={it.name}
                    className="w-14 h-14 object-cover rounded-lg border"
                    onError={(e) => (e.currentTarget.src = "/img/no-image.png")}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-purple-900">
                      {it.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      S/ {Number(it.price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQuantity(it.id)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold"
                      aria-label="Disminuir"
                    >
                      –
                    </button>
                    <span className="w-6 text-center text-sm">
                      {it.quantity}
                    </span>
                    <button
                      onClick={() => increaseQuantity(it.id)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold"
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(it.id)}
                    className="ml-2 text-red-500 hover:text-red-600 text-sm"
                    title="Quitar"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-700 font-semibold">Subtotal</span>
            <span className="text-purple-900 font-bold">
              S/ {Number(subtotal || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goCart}
              className="flex-1 rounded-full border border-purple-300 text-purple-700 py-2 font-semibold hover:bg-purple-50"
            >
              Ir al carrito
            </button>
            <button
              onClick={goPay}
              className="flex-1 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white py-2 font-semibold shadow hover:shadow-md"
            >
              Pagar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
