// src/components/CartQuickView.jsx
import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function CartQuickView() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
  } = useContext(CartContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openEv = () => setOpen(true);
    const toggleEv = () => setOpen((v) => !v);
    const closeEv = () => setOpen(false);
    window.addEventListener("cart:quickview:open", openEv);
    window.addEventListener("cart:quickview:toggle", toggleEv);
    window.addEventListener("cart:quickview:close", closeEv);
    // retrocompatibilidad por si en algún lugar emites "cart:open"
    window.addEventListener("cart:open", openEv);
    return () => {
      window.removeEventListener("cart:quickview:open", openEv);
      window.removeEventListener("cart:quickview:toggle", toggleEv);
      window.removeEventListener("cart:quickview:close", closeEv);
      window.removeEventListener("cart:open", openEv);
    };
  }, []);

  if (!open) return null;

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 z-[90] bg-black/40"
        onClick={() => setOpen(false)}
      />

      {/* sheet */}
      <div
        className="fixed left-0 right-0 z-[95] bg-white rounded-t-3xl shadow-2xl"
        style={{
          bottom: `calc(env(safe-area-inset-bottom, 0px))`,
          maxHeight: "70vh",
        }}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="text-purple-900 font-extrabold text-lg">Tu carrito</div>
          <button
            className="text-purple-500 hover:text-purple-700 text-xl"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="px-4 pb-3 space-y-3 overflow-auto" style={{ maxHeight: "52vh" }}>
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              Tu carrito está vacío.
            </div>
          ) : (
            cartItems.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 border rounded-xl p-3"
              >
                <img
                  src={
                    it.imagen_url?.startsWith("http")
                      ? it.imagen_url
                      : it.imagen_url
                      ? `${import.meta.env.VITE_API_URL || "http://localhost:3001"}${it.imagen_url.startsWith("/") ? it.imagen_url : "/uploads/" + it.imagen_url}`
                      : "/img/no-image.png"
                  }
                  alt={it.name}
                  className="w-14 h-14 object-cover rounded-lg border"
                  onError={(e) => (e.currentTarget.src = "/img/no-image.png")}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-purple-900 truncate">
                    {it.name}
                  </div>
                  <div className="text-xs text-gray-500">S/ {Number(it.price).toFixed(2)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={() => decreaseQuantity(it.id)}
                    aria-label="Disminuir"
                  >
                    −
                  </button>
                  <span className="min-w-[1.5rem] text-center">{it.quantity}</span>
                  <button
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={() => increaseQuantity(it.id)}
                    aria-label="Aumentar"
                  >
                    +
                  </button>
                </div>

                <button
                  className="text-red-500 hover:text-red-700 ml-2"
                  onClick={() => removeFromCart(it.id)}
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t">
          <div className="flex items-center justify-between text-purple-900 mb-3">
            <span className="font-semibold">Subtotal</span>
            <span className="font-extrabold">S/ {Number(subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-full bg-purple-100 text-purple-700 font-semibold py-2"
              onClick={() => {
                setOpen(false);
                navigate("/cart", { replace: false });
              }}
            >
              Ir al carrito
            </button>
            <button
              className="flex-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2"
              onClick={() => {
                setOpen(false);
                navigate("/cart", { replace: false });
              }}
            >
              Pagar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
