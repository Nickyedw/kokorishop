// src/components/CartFab.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";

export default function CartFab({ onOpenCart }) {
  const { count, subtotal } = useCartTotals("cart");

  // popover visible?
  const [expanded, setExpanded] = useState(false);
  // arrastre
  const [dragging, setDragging] = useState(false);

  // posición del FAB en % del viewport (se guarda en localStorage)
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      return s ? JSON.parse(s) : { xPerc: 84, yPerc: 70 };
    } catch {
      return { xPerc: 84, yPerc: 70 };
    }
  });

  // refs
  const sizeRef = useRef({ w: 0, h: 0 });
  const wrapRef = useRef(null);
  const fabRef = useRef(null);
  const timerRef = useRef(null);

  // formateador
  const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

  // clamp posición a viewport (en %)
  const clampToViewport = useCallback((p) => {
    const { w = 0, h = 0 } = sizeRef.current || {};
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);

    const px = Math.min(maxX, Math.max(0, (p.xPerc / 100) * window.innerWidth));
    const py = Math.min(maxY, Math.max(0, (p.yPerc / 100) * window.innerHeight));

    return {
      xPerc: (px / window.innerWidth) * 100,
      yPerc: (py / window.innerHeight) * 100,
    };
  }, []);

  // medir tamaños para que el clamp funcione bien
  useEffect(() => {
    const el = wrapRef.current;
    if (el) {
      sizeRef.current = { w: el.offsetWidth, h: el.offsetHeight };
    }
    const onResize = () => {
      if (!fabRef.current || !wrapRef.current) return;
      sizeRef.current = {
        w: fabRef.current.offsetWidth,
        h: fabRef.current.offsetHeight,
      };
      setPos((p) => clampToViewport(p));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampToViewport]);

  // guardar posición cuando cambia
  useEffect(() => {
    localStorage.setItem("cartfab_pos", JSON.stringify(pos));
  }, [pos]);

  // mostrar popover automáticamente al agregar
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

  // === Drag ================================================================
  const startRef = useRef({
    down: false,
    x: 0,
    y: 0,
    startXPerc: 0,
    startYPerc: 0,
    moved: false,
  });

  const onPointerDown = (e) => {
    // capturamos sólo “toque primario”
    if (e.button !== undefined && e.button !== 0) return;
    startRef.current = {
      down: true,
      x: e.clientX,
      y: e.clientY,
      startXPerc: pos.xPerc,
      startYPerc: pos.yPerc,
      moved: false,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!startRef.current.down) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (!startRef.current.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      startRef.current.moved = true;
    }

    const nx = ((startRef.current.startXPerc / 100) * window.innerWidth + dx);
    const ny = ((startRef.current.startYPerc / 100) * window.innerHeight + dy);

    setPos(
      clampToViewport({
        xPerc: (nx / window.innerWidth) * 100,
        yPerc: (ny / window.innerHeight) * 100,
      })
    );
  };

  const onPointerUp = () => {
    if (!startRef.current.down) return;
    const { moved } = startRef.current;
    startRef.current.down = false;
    setDragging(false);
    if (!moved) {
      // click => alterna popover
      setExpanded((v) => !v);
    }
  };
  // ========================================================================

  // anclaje del popover según la X (si está a la derecha, lo mostramos a la izquierda)
  const anchorRight = pos.xPerc > 50;

  return (
    <div
      ref={wrapRef}
      className="fixed z-[1000]"
      // usamos vw/vh para que funcione sin leer window en el render
      style={{
        left: `${pos.xPerc}vw`,
        top: `${pos.yPerc}vh`,
        transform: "translate(-50%, -50%)",
        touchAction: "none", // arrastre fluido en móvil
      }}
    >
      {/* Popover */}
      {expanded && (
        <div
          className="absolute pointer-events-auto"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            ...(anchorRight
              ? { right: "calc(100% + 12px)" } // si el FAB está a la derecha, popover a la izquierda
              : { left: "calc(100% + 12px)" }), // si está a la izquierda, popover a la derecha
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white text-purple-900 rounded-2xl shadow-xl border border-purple-200 w-[280px] max-w-[78vw]">
            <div className="px-4 py-3 flex items-center gap-2 border-b">
              <span className="text-lg"><FaShoppingCart /></span>
              <span className="font-semibold">Ver carrito</span>
            </div>
            <div className="px-4 py-3 text-sm">
              <div className="text-gray-600">Subtotal: <strong>{fmt(subtotal)}</strong></div>
            </div>
            <div className="px-3 pb-3">
              <button
                className="w-full rounded-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-2.5 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                  onOpenCart?.(); // 🔔 abre QuickView (evento lo lanza CartLayout)
                }}
              >
                Abrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        ref={fabRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={(e) => {
          // si arrastraste, evitamos considerar click
          if (startRef.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setExpanded((v) => !v);
        }}
        className={`relative grid place-items-center w-[56px] h-[56px] rounded-full bg-pink-500 shadow-2xl border-2 border-yellow-300
          ${dragging ? "cursor-grabbing" : "cursor-grab"} select-none`}
        aria-label="Carrito"
      >
        <FaShoppingCart className="text-white text-xl drop-shadow" />
        {/* badge */}
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 grid place-items-center rounded-full bg-yellow-300 text-purple-900 text-xs font-extrabold border border-white">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
