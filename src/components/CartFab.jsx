// src/components/CartFab.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";
import CartQuickView from "./CartQuickView";

// helpers
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
function loadPos() {
  try {
    const raw = localStorage.getItem("cartfab_pos");
    if (raw) {
      const p = JSON.parse(raw);
      if (Number.isFinite(p?.xPerc) && Number.isFinite(p?.yPerc)) return p;
    }
  } catch {/* noop */}
  return { xPerc: 84, yPerc: 78 };
}

export default function CartFab({ onOpenCart }) {
  // Totales leídos del storage "cart"
  const { count, subtotal } = useCartTotals("cart");

  // UI
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState(loadPos());

  // refs
  const wrapRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0, moved: false, pointerId: null });
  const timerRef = useRef(null);

  // Persistir posición
  useEffect(() => {
    try {
      localStorage.setItem("cartfab_pos", JSON.stringify(pos));
    } catch {/* noop */}
  }, [pos]);

  // Mostrar popover automáticamente cuando se agrega al carrito
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

  // Abrir QuickView
  const openQuick = () => {
    if (onOpenCart) onOpenCart();
    else window.dispatchEvent(new Event("cart:open"));
  };

  // Tap (si no hubo movimiento)
  const handleTap = () => setExpanded((v) => !v);

  // === Pointer events (drag + tap) ===
  const onPointerDown = (e) => {
    const el = wrapRef.current;
    if (!el) return;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      moved: false,
      pointerId: e.pointerId,
    };
    el.setPointerCapture?.(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const s = startRef.current;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) s.moved = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 + dx;
    const cy = rect.top + rect.height / 2 + dy;

    setPos({
      xPerc: clamp((cx / vw) * 100, 5, 95),
      yPerc: clamp((cy / vh) * 100, 15, 92),
    });

    // actualiza origen para que el movimiento sea suave
    startRef.current.x = e.clientX;
    startRef.current.y = e.clientY;
  };

  const onPointerUp = () => {
    const el = wrapRef.current;
    el?.releasePointerCapture?.(startRef.current.pointerId);
    const moved = startRef.current.moved;
    setDragging(false);
    if (!moved) handleTap(); // si no se arrastró, tómalo como click
  };

  return (
    <>
      <div
        ref={wrapRef}
        className="fixed z-[60] pointer-events-auto"
        style={{
          left: `calc(${pos.xPerc}vw - 24px)`,
          top: `calc(${pos.yPerc}vh - 24px)`,
          touchAction: "none", // permite drag en mobile
          userSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* FAB */}
        <button
          type="button"
          onClick={handleTap}
          className="relative grid place-items-center w-12 h-12 rounded-full bg-pink-500 text-white shadow-lg active:scale-95 transition"
          aria-label="Carrito"
        >
          <FaShoppingCart />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[22px] h-5 rounded-full grid place-items-center bg-yellow-300 text-purple-900 text-xs font-extrabold px-1">
              {count}
            </span>
          )}
        </button>

        {/* Popover pegado al FAB */}
        <div
          className={`absolute left-14 top-1/2 -translate-y-1/2 transition-all duration-200 ${
            expanded
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2 pointer-events-none"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-xl p-3 w-[220px] border">
            <div className="text-[13px] text-gray-600">Ver carrito</div>
            <div className="text-sm font-semibold text-gray-900">
              Subtotal: S/ {Number(subtotal || 0).toFixed(2)}
            </div>
            <button
              onClick={openQuick}
              className="mt-2 w-full rounded-full bg-pink-500 text-white font-bold py-1.5"
            >
              Abrir
            </button>
          </div>
        </div>
      </div>

      {/* QuickView modal (escucha `cart:open`) */}
      <CartQuickView />
    </>
  );
}
