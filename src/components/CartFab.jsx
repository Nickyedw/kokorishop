// src/components/CartFab.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";

export default function CartFab({ onOpenCart }) {
  const { count, subtotal } = useCartTotals("cart");
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Posición en porcentaje (persistida)
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      return s ? JSON.parse(s) : { xPerc: 86, yPerc: 72 };
    } catch {
      return { xPerc: 86, yPerc: 72 };
    }
  });

  const wrapRef = useRef(null);
  const fabRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef({ x0: 0, y0: 0, x: 0, y: 0, moved: false });

  // Persistir posición
  useEffect(() => {
    localStorage.setItem("cartfab_pos", JSON.stringify(pos));
  }, [pos]);

  // Mostrar popover cuando se agrega algo
  useEffect(() => {
    const onAdd = () => {
      setExpanded(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setExpanded(false), 2400);
    };
    window.addEventListener("cart:add", onAdd);
    return () => {
      window.removeEventListener("cart:add", onAdd);
      clearTimeout(timerRef.current);
    };
  }, []);

  // Cerrar popover si se abre el QuickView (pero mantener visible el FAB)
  useEffect(() => {
    const close = () => setExpanded(false);
    window.addEventListener("cart:quick:open", close);
    return () => window.removeEventListener("cart:quick:open", close);
  }, []);

  // Helpers de posición
  const clamp = (p) => ({
    xPerc: Math.min(95, Math.max(5, p.xPerc)),
    yPerc: Math.min(92, Math.max(10, p.yPerc)),
  });
  const toPx = (p) => ({
    x: (p.xPerc / 100) * (window.innerWidth || 1),
    y: (p.yPerc / 100) * (window.innerHeight || 1),
  });
  const toPerc = (x, y) =>
    clamp({
      xPerc: (x / (window.innerWidth || 1)) * 100,
      yPerc: (y / (window.innerHeight || 1)) * 100,
    });

  // Drag suave compatible con móvil
  const onPointerDown = (e) => {
    const p = toPx(pos);
    startRef.current = { x0: e.clientX, y0: e.clientY, x: p.x, y: p.y, moved: false };
    setDragging(true);
    wrapRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startRef.current.x0;
    const dy = e.clientY - startRef.current.y0;
    if (!startRef.current.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      startRef.current.moved = true; // evita que dispare click al terminar
    }
    const nx = startRef.current.x + dx;
    const ny = startRef.current.y + dy;
    setPos(toPerc(nx, ny));
  };
  const onPointerUp = (e) => {
    setDragging(false);
    wrapRef.current?.releasePointerCapture?.(e.pointerId);
    if (!startRef.current.moved) setExpanded((v) => !v); // tap = toggle popover
  };

  const left = `calc(${pos.xPerc}% - 28px)`; // botón ~56px
  const top = `calc(${pos.yPerc}% - 28px)`;

  const openQuick = () => {
    setExpanded(false);
    onOpenCart?.();
  };

  return (
    <div
      ref={wrapRef}
      className="fixed z-[70] select-none" /* por encima del overlay */
      style={{ left, top, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Botón */}
      <button
        ref={fabRef}
        type="button"
        aria-label="Carrito"
        className="relative w-14 h-14 rounded-full bg-pink-500 text-white shadow-lg grid place-items-center"
      >
        <FaShoppingCart />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-yellow-300 text-purple-900 text-xs grid place-items-center px-1">
            {count}
          </span>
        )}
      </button>

      {/* Popover anclado al FAB (no bloquea el drag del botón) */}
      <div
        className={`absolute -left-[220px] top-16 w-[260px] rounded-2xl bg-white text-purple-900 shadow-xl p-3
        ${expanded ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}
        transition-[opacity,transform] duration-150`}
      >
        <div className="font-semibold text-sm">🛒 Ver carrito</div>
        <div className="text-xs text-gray-600">Subtotal: S/ {subtotal.toFixed(2)}</div>
        <button
          onClick={openQuick}
          className="mt-2 w-full rounded-full bg-pink-500 text-white font-semibold py-2"
        >
          Abrir
        </button>
      </div>
    </div>
  );
}
