// src/components/MiniCart.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCartTotals from "../hooks/useCartTotals";

export default function MiniCart({ cartPath = "/Cart" }) {
  const navigate = useNavigate();
  const { count, subtotal } = useCartTotals();
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setOpen(false), 2600);
    };
    window.addEventListener("minicart:open", onOpen);
    return () => {
      window.removeEventListener("minicart:open", onOpen);
      clearTimeout(timerRef.current);
    };
  }, []);

  if (!count) return null;

  return (
    <div
      className={`fixed bottom-3 left-0 right-0 z-[60] mx-auto w-[92%] max-w-md transition-all duration-300
      ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
    >
      <button
        onClick={() => navigate(cartPath, { replace: false })}
        className="w-full rounded-full bg-purple-700/95 hover:bg-purple-700 text-white shadow-lg px-4 py-3 flex items-center justify-between"
        aria-label="Ver carrito"
      >
        <div className="flex items-center gap-2">
          <span className="inline-grid place-items-center w-7 h-7 bg-pink-500 rounded-full text-xs font-bold">
            {count}
          </span>
          <span className="font-semibold">Ver carrito</span>
        </div>
        <span className="text-sm opacity-90">Subtotal: S/ {Number(subtotal).toFixed(2)}</span>
      </button>
    </div>
  );
}
