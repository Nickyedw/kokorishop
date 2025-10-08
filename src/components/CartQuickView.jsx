import React, { useEffect, useState, useContext } from "react";
import { CartContext } from "../context/CartContext";

const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";
const toFullImg = (raw) => {
  if (!raw) return "/img/no-image.png";
  let s = String(raw).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  const upIdx = s.toLowerCase().indexOf("/uploads/");
  if (upIdx >= 0) s = s.slice(upIdx);
  if (!s.startsWith("/")) s = `/${s}`;
  return `${API_APP}${s}`;
};

export default function CartQuickView() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
  } = useContext(CartContext);

  const [open, setOpen] = useState(false);
  const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener("cart:quick:open", openIt);
    // (compat opcional) window.addEventListener("cart:open", openIt);
    return () => {
      window.removeEventListener("cart:quick:open", openIt);
      // window.removeEventListener("cart:open", openIt);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

      {/* panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-bold text-purple-900">Tu carrito</h3>
          <button className="text-xl" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="max-h-[55vh] overflow-auto px-4 py-3 space-y-3">
          {cartItems.map((it) => (
            <div key={it.id} className="flex items-center gap-3 p-3 border rounded-xl">
              <img
                src={toFullImg(it.imagen_url)}
                alt={it.name}
                className="w-14 h-14 object-cover rounded-md border"
                onError={(e) => (e.currentTarget.src = "/img/no-image.png")}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-purple-900 truncate">{it.name}</div>
                <div className="text-xs text-gray-500">{fmt(it.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 rounded-full bg-gray-100"
                  onClick={() => decreaseQuantity(it.id)}
                >−</button>
                <div className="w-6 text-center">{it.quantity}</div>
                <button
                  className="w-8 h-8 rounded-full bg-gray-100"
                  onClick={() => increaseQuantity(it.id)}
                >+</button>
              </div>
              <button
                className="ml-2 text-pink-600"
                onClick={() => removeFromCart(it.id)}
                title="Quitar"
              >×</button>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t">
          <div className="flex items-center justify-between text-purple-900 font-semibold">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="mt-3 flex gap-3">
            <a
              href="/Cart"
              className="flex-1 text-center rounded-full border border-purple-300 py-2.5"
            >
              Ir al carrito
            </a>
            <a
              href="/Cart?checkout=1"
              className="flex-1 text-center rounded-full bg-fuchsia-600 text-white py-2.5"
            >
              Pagar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
