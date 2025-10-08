// src/components/CartFab.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";

export default function CartFab({ onOpenCart }) {
  const { count, subtotal } = useCartTotals("cart");

  // popover (lo que dice "Ver carrito / Subtotal / Abrir")
  const [expanded, setExpanded] = useState(false);

  // posición en píxeles (persistimos en % para que sobreviva a cambios de pantalla)
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      if (s) {
        const { xPerc, yPerc } = JSON.parse(s);
        return {
          x: Math.round((xPerc / 100) * (window.innerWidth - 56)),
          y: Math.round((yPerc / 100) * (window.innerHeight - 56)),
        };
      }
    } catch {/* noop */}
    return { x: window.innerWidth - 80, y: Math.round(window.innerHeight * 0.65) };
  });

  const fabRef = useRef(null);
  const pointerIdRef = useRef(null);
  const draggingRef = useRef(false);
  const startOffsetRef = useRef({ dx: 0, dy: 0 });
  const sizeRef = useRef({ w: 56, h: 56 });
  const timerRef = useRef(null);

  const S = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

  // medir tamaño del FAB y clamp de posición al cambiar viewport
  useEffect(() => {
    const el = fabRef.current;
    if (el) sizeRef.current = { w: el.offsetWidth, h: el.offsetHeight };

    const onResize = () => {
      if (fabRef.current) {
        sizeRef.current = {
          w: fabRef.current.offsetWidth,
          h: fabRef.current.offsetHeight,
        };
      }
      setPos((p) => clampToViewport(p));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // mostrar popover automáticamente cuando se agrega algo
  useEffect(() => {
    const onAdd = () => {
      setExpanded(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setExpanded(false), 2600);
    };
    window.addEventListener("cart:add", onAdd);
    return () => {
      window.removeEventListener("cart:add", onAdd);
      clearTimeout(timerRef.current);
    };
  }, []);

  const clampToViewport = (p) => {
    const margin = 8;
    const { w, h } = sizeRef.current;
    const maxX = window.innerWidth - w - margin;
    const maxY = window.innerHeight - h - margin;
    return {
      x: Math.max(margin, Math.min(p.x, maxX)),
      y: Math.max(margin, Math.min(p.y, maxY)),
    };
  };

  const persist = (p) => {
    const { w, h } = sizeRef.current;
    const maxX = Math.max(1, window.innerWidth - w);
    const maxY = Math.max(1, window.innerHeight - h);
    const xPerc = Math.round((p.x / maxX) * 100);
    const yPerc = Math.round((p.y / maxY) * 100);
    try {
      localStorage.setItem("cartfab_pos", JSON.stringify({ xPerc, yPerc }));
    } catch {/* noop */}
  };

  // —— Drag con pointer capture (arrastras fluido por toda la pantalla)
  const onPointerDown = (e) => {
    const el = fabRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    pointerIdRef.current = e.pointerId;
    draggingRef.current = true;

    const rect = el.getBoundingClientRect();
    startOffsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };

    // sin transición mientras arrastro
    el.style.transition = "none";
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const { dx, dy } = startOffsetRef.current;
    setPos(clampToViewport({ x: e.clientX - dx, y: e.clientY - dy }));
  };

  const onPointerUp = () => {
    const el = fabRef.current;
    if (pointerIdRef.current != null) {
      el?.releasePointerCapture?.(pointerIdRef.current);
      pointerIdRef.current = null;
    }
    draggingRef.current = false;
    if (el) el.style.transition = "transform 200ms ease";
    setPos((p) => {
      persist(p);
      return p;
    });
  };

  // click: abre/cierra popover (se ignora si venimos arrastrando)
  const onFabClick = () => {
    if (draggingRef.current) return;
    setExpanded((v) => !v);
  };

  // abrir quickview desde el popover
  const openQuick = () => {
    setExpanded(false);
    window.dispatchEvent(new CustomEvent("cart:quick:open"));
    onOpenCart?.();
  };

  // estilos
  const styleFab = {
    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
    touchAction: "none", // evita que el scroll robe el gesto en móvil
    transition: "transform 200ms ease",
  };

  // si estamos muy a la derecha, que el popover se pegue a la derecha para no salirse
  const nearRight = pos.x > window.innerWidth - 220;
  const popStyle = {
    left: nearRight ? "auto" : "-12px",
    right: nearRight ? "-12px" : "auto",
  };

  return (
    <>
      {/* FAB */}
      <button
        ref={fabRef}
        className="fixed z-50 w-14 h-14 rounded-full bg-pink-500 shadow-lg text-white grid place-items-center"
        style={styleFab}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onFabClick}
        aria-label="Abrir carrito"
      >
        <FaShoppingCart className="text-xl" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 text-[11px] font-bold bg-yellow-300 text-purple-900 min-w-[20px] h-[20px] rounded-full grid place-items-center px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Popover anclado al FAB */}
      <div
        className={`fixed z-40 ${
          expanded ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"
        } transition-[opacity,transform] duration-150`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y - 80}px, 0)` }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="min-w-[240px] max-w-[280px] bg-white text-purple-900 rounded-2xl shadow-2xl border p-3"
          style={popStyle}
        >
          <div className="text-sm font-semibold flex items-center gap-2 mb-1">
            <FaShoppingCart /> Ver carrito
          </div>
          <div className="text-xs text-gray-600">
            Subtotal: <b>{S(subtotal)}</b>
          </div>
          <button
            onClick={openQuick}
            className="mt-3 w-full rounded-full bg-pink-500 hover:bg-pink-600 text-white py-2 font-bold"
          >
            Abrir
          </button>
        </div>
      </div>
    </>
  );
}
