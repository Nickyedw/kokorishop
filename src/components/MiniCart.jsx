// src/components/MiniCart.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCartTotals from "../hooks/useCartTotals";

export default function MiniCart({ cartPath = "/cart" }) {
  const navigate = useNavigate();
  const { count, subtotal } = useCartTotals();
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

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

  if (!count || !open) return null;

  return (
    <div className="fixed bottom-3 left-0 right-0 z-[60] mx-auto w-[92%] max-w-md">
      <div className="rounded-2xl bg-white/95 text-purple-900 shadow-xl backdrop-blur border border-white/40 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-500 text-white text-xs">
            {count}
          </span>
          <span>Ver carrito</span>
        </div>
        <div className="text-sm text-purple-700">
          Subtotal: <strong>S/ {Number(subtotal || 0).toFixed(2)}</strong>
        </div>
        <button
          onClick={() => navigate(cartPath, { replace: false })}
          className="ml-3 rounded-full bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 text-sm font-medium"
        >
          Abrir
        </button>
      </div>
    </div>
  );
}
