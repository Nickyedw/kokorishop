// src/components/CartFab.jsx
import React, { useEffect, useRef, useState } from "react";
import useCartTotals from "../hooks/useCartTotals";

export default function CartFab({ onOpenCart }) {
  const { count, subtotal } = useCartTotals();
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      return s ? JSON.parse(s) : { xPerc: 84, yPerc: 78 };
    } catch {
      return { xPerc: 84, yPerc: 78 };
    }
  });

  const holdRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef({ startX: 0, startY: 0, baseXP: 0, baseYP: 0 });
  const movedRef = useRef(false);

  // Mostrar por 2.5s cuando se agrega al carrito
  useEffect(() => {
    const handler = () => {
      setExpanded(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setExpanded(false), 2500);
    };
    window.addEventListener("cart:add", handler);
    return () => {
      window.removeEventListener("cart:add", handler);
      clearTimeout(timerRef.current);
    };
  }, []);

  // Drag (pointer events, táctil y mouse)
  useEffect(() => {
    const el = holdRef.current;
    if (!el) return;

    function onDown(e) {
      e.preventDefault();
      setDragging(true);
      movedRef.current = false;
      startRef.current.startX = e.clientX;
      startRef.current.startY = e.clientY;
      startRef.current.baseXP = pos.xPerc;
      startRef.current.baseYP = pos.yPerc;
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp, { passive: false });
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const dx = e.clientX - startRef.current.startX;
      const dy = e.clientY - startRef.current.startY;
      if (Math.abs(dx) + Math.abs(dy) > 6) movedRef.current = true;

      const vw = Math.max(320, window.innerWidth);
      const vh = Math.max(480, window.innerHeight);
      const xPerc = Math.min(96, Math.max(4, startRef.current.baseXP + (dx / vw) * 100));
      const yPerc = Math.min(96, Math.max(4, startRef.current.baseYP + (dy / vh) * 100));
      const next = { xPerc, yPerc };
      setPos(next);
      try {
        localStorage.setItem("cartfab_pos", JSON.stringify(next));
      } catch {/* noop */}
    }

    function onUp(e) {
      e.preventDefault();
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    el.addEventListener("pointerdown", onDown, { passive: false });
    return () => el.removeEventListener("pointerdown", onDown);
  }, [dragging, pos]);

  const openCart = () => {
    if (dragging || movedRef.current) return;
    if (onOpenCart) onOpenCart();
    else window.dispatchEvent(new CustomEvent("minicart:open"));
  };

  // No muestres el FAB si el carrito está vacío
  if (!count) return null;

  return (
    <div
      ref={holdRef}
      role="button"
      aria-label="Carrito"
      onClick={openCart}
      className="fixed z-[70] select-none cursor-pointer touch-none"
      style={{
        left: `${pos.xPerc}vw`,
        top: `${pos.yPerc}vh`,
        transform: "translate(-50%, -50%)",
        touchAction: "none",
      }}
    >
      <div className="relative">
        {/* Badge de cantidad */}
        <span className="absolute -top-2 -right-2 grid place-items-center w-5 h-5 rounded-full bg-yellow-400 text-purple-900 text-xs font-extrabold shadow">
          {count}
        </span>

        {/* Botón redondo */}
        <div className={`w-12 h-12 grid place-items-center rounded-full shadow-lg
                         ${expanded ? "bg-pink-500" : "bg-purple-700"} text-white`}>
          🛒
        </div>

        {/* Subtotal expandible */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1
                      rounded-full bg-purple-800 text-white text-xs shadow
                      transition-all duration-300
                      ${expanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
        >
          Subtotal: S/ {Number(subtotal).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
