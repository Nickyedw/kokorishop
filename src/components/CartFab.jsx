// src/components/CartFab.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";

export default function CartFab() {
  const { count, subtotal } = useCartTotals("cart");

  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      return s ? JSON.parse(s) : { xPerc: 84, yPerc: 70 };
    } catch {
      return { xPerc: 84, yPerc: 70 };
    }
  });

  const wrapRef = useRef(null);
  const holdRef = useRef(null);
  const timerRef = useRef(null);

  // Guardar posición
  useEffect(() => {
    localStorage.setItem("cartfab_pos", JSON.stringify(pos));
  }, [pos]);

  // Mostrar popover automáticamente al agregar al carrito
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

  // Drag (pointer events)
  useEffect(() => {
    const el = holdRef.current;
    if (!el) return;

    let moved = false;

    const onDown = () => {
      moved = false;
      setDragging(true);
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    };

    const onMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      if (x == null || y == null) return;
      moved = true;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const xPerc = Math.max(6, Math.min(94, (x / vw) * 100));
      const yPerc = Math.max(10, Math.min(88, (y / vh) * 100));
      setPos({ xPerc, yPerc });
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      setDragging(false);
      // Si no se movió, considéralo click (toggle del popover)
      if (!moved) setExpanded((v) => !v);
    };

    el.addEventListener("pointerdown", onDown);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, []);

  if (!count) return null;

  const attachLeft = pos.xPerc > 50;
  const subtotalStr = `S/ ${Number(subtotal || 0).toFixed(2)}`;

  const openQuick = () => {
    setExpanded(false);
    window.dispatchEvent(new CustomEvent("cart:quick:open"));
  };

  return (
    <div
      ref={wrapRef}
      className="fixed z-[70] select-none"
      style={{
        left: `${pos.xPerc}vw`,
        top: `${pos.yPerc}vh`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Popover pegado al FAB */}
      {expanded && (
        <div className={`absolute ${attachLeft ? "right-[64px]" : "left-[64px]"} -top-1`}>
          <div className="bg-white text-purple-900 rounded-2xl shadow-lg border border-purple-200/60 px-3 py-2 w-[210px]">
            <div className="text-[13px] font-semibold">🛒 Ver carrito</div>
            <div className="text-[12px] text-gray-600 mt-0.5">
              Subtotal: <b>{subtotalStr}</b>
            </div>
            <button
              onClick={openQuick}
              className="mt-2 w-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-sm py-1.5 font-semibold shadow hover:shadow-md"
            >
              Abrir
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        ref={holdRef}
        type="button"
        aria-label="Carrito"
        title="Carrito"
        className={`relative grid place-items-center w-12 h-12 rounded-full
          bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white shadow-xl
          border border-white/60 backdrop-blur
          ${dragging ? "cursor-grabbing scale-95" : "cursor-grab hover:scale-105"}
          transition`}
      >
        <FaShoppingCart className="text-lg" />
        <span
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-purple-900 text-xs font-bold grid place-items-center border border-white"
          aria-label={`Productos en el carrito: ${count}`}
        >
          {count}
        </span>
      </button>
    </div>
  );
}
