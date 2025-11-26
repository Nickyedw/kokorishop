// src/components/MiniCart.jsx 
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useCartTotals from "../hooks/useCartTotals";

export default function MiniCart({ cartPath = "/cart" }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { count, subtotal } = useCartTotals();
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  // 🚫 No mostrar MiniCart dentro de la página del carrito
  const estaEnCart = pathname.startsWith("/cart");

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setOpen(false), 2400);
    };

    window.addEventListener("minicart:open", onOpen);
    return () => {
      window.removeEventListener("minicart:open", onOpen);
      clearTimeout(timerRef.current);
    };
  }, []);

  if (!count || !open || estaEnCart) return null;

  const subtotalText = `S/ ${Number(subtotal || 0).toFixed(2)}`;

  return (
    <div
      className="
        fixed inset-x-0 bottom-3 z-[60]
        flex justify-center
        px-3 sm:px-4
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-3xl
          bg-gradient-to-r from-purple-700 via-fuchsia-500 to-pink-500
          text-white shadow-2xl backdrop-blur-md
          border border-white/30
          px-3 py-2
          flex items-center justify-between gap-3
        "
      >
        {/* Izquierda: icono + texto */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center text-lg">
              🛒
            </div>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-300 text-purple-900 text-[11px] font-bold shadow">
              {count}
            </span>
          </div>

          <div className="leading-tight text-sm">
            <p className="font-semibold">Tienes productos en tu carrito</p>
            <p className="text-xs text-purple-100">
              Revísalos antes de que se agoten 💜
            </p>
          </div>
        </div>

        {/* Derecha: subtotal + botón */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <p className="text-purple-100">Subtotal</p>
            <p className="font-bold text-white text-sm">{subtotalText}</p>
          </div>

          <button
            onClick={() => navigate(cartPath, { replace: false })}
            className="
              rounded-full bg-white text-purple-700 hover:bg-purple-50
              px-3 py-1.5 text-xs font-semibold shadow-md transition
              active:scale-[0.97]
            "
          >
            Ver carrito
          </button>
        </div>
      </div>
    </div>
  );
}
