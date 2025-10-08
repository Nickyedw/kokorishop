// src/components/CartFab.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";

export default function CartFab({ onOpenCart }) {
  const { count, subtotal } = useCartTotals("cart");

  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  // posición en porcentaje (funciona bien en distintos tamaños)
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      return s ? JSON.parse(s) : { xPerc: 84, yPerc: 70 };
    } catch {
      return { xPerc: 84, yPerc: 70 };
    }
  });

  const sizeRef = useRef({ w: 0, h: 0 });
  const wrapRef = useRef(null);
  const fabRef = useRef(null);
  const timerRef = useRef(null);

  const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

  // ⛔️ Si el carrito queda vacío: cierra el popover
  useEffect(() => {
    if (count === 0) setExpanded(false);
  }, [count]);

  // evita que se salga de la pantalla al arrastrar o al redimensionar
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

  // medir tamaño del FAB y recolocar si hace falta
  useEffect(() => {
    const el = wrapRef.current;
    if (el) sizeRef.current = { w: el.offsetWidth, h: el.offsetHeight };

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

  // persistir posición
  useEffect(() => {
    localStorage.setItem("cartfab_pos", JSON.stringify(pos));
  }, [pos]);

  // abrir popover automáticamente cuando se agrega algo al carrito
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

  // === drag (pointer events) ===
  const startRef = useRef({
    down: false,
    x: 0,
    y: 0,
    startXPerc: 0,
    startYPerc: 0,
    moved: false,
  });

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // solo click principal
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

    const nx = (startRef.current.startXPerc / 100) * window.innerWidth + dx;
    const ny = (startRef.current.startYPerc / 100) * window.innerHeight + dy;

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
    if (!moved) setExpanded((v) => !v); // solo si no arrastró, alterna el popover
  };
  // === /drag ===

  const anchorRight = pos.xPerc > 50; // si está a la derecha, abrimos el popover hacia la izquierda
  const side = anchorRight ? "left" : "right";

  // 🚫 No renderizar FAB (ni popover) cuando el carrito está vacío
  if (count === 0) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed z-[1000]"
      style={{
        left: `${pos.xPerc}vw`,
        top: `${pos.yPerc}vh`,
        transform: "translate(-50%, -50%)",
        touchAction: "none",
      }}
    >
      {/* POPOVER COMPACTO */}
      {expanded && count > 0 && (
        <div
          className={[
            "absolute z-[60] select-none rounded-2xl bg-white text-purple-900 shadow-xl ring-1 ring-black/5",
            "opacity-100 translate-y-0 pointer-events-auto",
            side === "left" ? "right-[calc(100%+10px)]" : "left-[calc(100%+10px)]",
          ].join(" ")}
          style={{ width: "min(72vw, 260px)", top: "50%", transform: "translateY(-50%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 pt-2 pb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold">
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
                <path
                  fill="currentColor"
                  d="M7 18a2 2 0 1 0 0 4a2 2 0 0 0 0-4m10 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4M6.2 6l.5 2H20a1 1 0 0 1 1 1c0 .1 0 .2-.1.3l-1.6 5.6c-.2.6-.8 1.1-1.5 1.1H8a1.9 1.9 0 0 1-1.9-1.5L4 4H2V2h2.6c.9 0 1.6.6 1.8 1.4L6.2 6z"
                />
              </svg>
              Ver carrito
            </span>
          </div>

          <div className="px-3 pb-2 text-[12px] text-gray-600">
            Subtotal: <span className="font-semibold text-purple-800">{fmt(subtotal)}</span>
          </div>

          <div className="px-3 pb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
                if (typeof onOpenCart === "function") onOpenCart();
                else window.dispatchEvent(new CustomEvent("cart:quick:open"));
              }}
              className="w-full h-9 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white text-[13px] font-semibold shadow-md active:scale-[.98] transition"
            >
              Abrir
            </button>
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
          // evitamos click “extra” cuando ya manejamos pointerUp
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v);
        }}
        className={`relative grid place-items-center w-[56px] h-[56px] rounded-full bg-pink-500 shadow-2xl border-2 border-yellow-300 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        } select-none`}
        aria-label="Carrito"
      >
        <FaShoppingCart className="text-white text-xl drop-shadow" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 grid place-items-center rounded-full bg-yellow-300 text-purple-900 text-xs font-extrabold border border-white">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
