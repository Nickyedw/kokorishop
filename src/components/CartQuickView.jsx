// src/components/CartQuickView.jsx
import React, { useEffect, useState, useContext } from "react";
import { CartContext } from "../context/CartContext";

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
    window.addEventListener("cart:open", openIt);        // compat
    window.addEventListener("minicart:open", openIt);    // compat

    return () => {
      window.removeEventListener("cart:quick:open", openIt);
      window.removeEventListener("cart:open", openIt);
      window.removeEventListener("minicart:open", openIt);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      {/* sheet */}
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[78vh] overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-purple-900">Tu carrito</h3>
          <button onClick={() => setOpen(false)} className="text-xl px-2 py-1">×</button>
        </div>

        <div className="p-4 space-y-3">
          {cartItems.map((it) => (
            <div key={it.id} className="flex items-center gap-3 border rounded-xl p-3">
              <img
                src={it.imagen_url || "/img/no-image.png"}
                alt={it.name}
                className="w-14 h-14 rounded-md object-cover border"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-purple-900 truncate">{it.name}</div>
                <div className="text-xs text-gray-500">{fmt(it.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => decreaseQuantity(it.id)} className="w-7 h-7 rounded-full border">−</button>
                <div className="w-6 text-center">{it.quantity}</div>
                <button onClick={() => increaseQuantity(it.id)} className="w-7 h-7 rounded-full border">+</button>
              </div>
              <button
                onClick={() => removeFromCart(it.id)}
                className="ml-2 text-pink-600 hover:text-pink-700"
                title="Quitar"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-purple-800">
            <div className="text-sm">Subtotal</div>
            <div className="text-lg font-bold">{fmt(subtotal)}</div>
          </div>
          <div className="flex gap-3">
            <a
              href="/Cart"
              className="rounded-full px-4 py-2 border text-purple-700 hover:bg-purple-50"
            >
              Ir al carrito
            </a>
            <a
              href="/Cart?checkout=1"
              className="rounded-full px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
            >
              Pagar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
