// src/components/CartFab.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";

const SIZE = 58;          // diámetro del botón
const MARGIN = 10;        // margen a los bordes
const TAP_THRESHOLD = 8;  // px para diferenciar tap de drag

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

// Lee un “safe area” inferior aproximado (iOS notches, barras)
function safeBottom() {
  // valor mínimo 0, máx 24 aprox; deja de 12 si no hay soporte
  try {
    // usamos CSS env() via estilo temporal
    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.bottom = "env(safe-area-inset-bottom)";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    document.body.removeChild(probe);
    return Math.max(0, Math.min(24, rect.bottom));
  } catch {
    return 12;
  }
}

export default function CartFab({ onOpenCart }) {
  const { count, subtotal } = useCartTotals("cart");

  // Posición guardada como porcentaje (robusto entre pantallas)
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      if (s) return JSON.parse(s);
    } catch {/* noop */}
    // por defecto abajo-derecha
    return { xPerc: 84, yPerc: 78 };
  });

  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  // refs para drag
  const startRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);

  // === helpers: px <-> %
  const toPx = (xPerc, yPerc) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const sb = safeBottom();
    const x = clamp((xPerc / 100) * W, MARGIN, W - SIZE - MARGIN);
    const y = clamp((yPerc / 100) * H, MARGIN, H - SIZE - MARGIN - sb);
    return { x, y };
  };
  const toPerc = (x, y) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const xPerc = clamp((x / W) * 100, 0, 100);
    const yPerc = clamp((y / H) * 100, 0, 100);
    return { xPerc, yPerc };
  };

  // posición en píxeles para estilo inline
  const [posPx, setPosPx] = useState(() => toPx(pos.xPerc, pos.yPerc));

  // Recalcular en resize/orientation
  useEffect(() => {
    const onResize = () => setPosPx(toPx(pos.xPerc, pos.yPerc));
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [pos.xPerc, pos.yPerc]);

  // Guardar posición en localStorage cuando cambia el % (debounce simple)
  useEffect(() => {
    localStorage.setItem("cartfab_pos", JSON.stringify(pos));
  }, [pos]);

  // Mostrar popover por 2.5s cuando se agrega algo al carrito
  useEffect(() => {
    const onAdd = () => {
      setExpanded(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setExpanded(false), 2500);
    };
    window.addEventListener("cart:add", onAdd);
    return () => {
      window.removeEventListener("cart:add", onAdd);
      clearTimeout(timerRef.current);
    };
  }, []);

  // === Drag con Pointer Events (tap vs drag)
  const onPointerDown = (e) => {
    if (!wrapRef.current) return;
    movedRef.current = false;
    setDragging(true);
    // posición inicial del puntero y del botón
    startRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: posPx.x, y: posPx.y };
    // ocultar popover si estaba abierto
    setExpanded(false);
    wrapRef.current.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) {
      movedRef.current = true;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    const sb = safeBottom();
    const nextX = clamp(startPosRef.current.x + dx, MARGIN, W - SIZE - MARGIN);
    const nextY = clamp(
      startPosRef.current.y + dy,
      MARGIN,
      H - SIZE - MARGIN - sb
    );
    setPosPx({ x: nextX, y: nextY });
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    wrapRef.current?.releasePointerCapture?.(e.pointerId);

    // si no se movió -> tratar como TAP
    if (!movedRef.current) {
      setExpanded((v) => !v);
      return;
    }

    // si se movió, persistimos %
    const perc = toPerc(posPx.x, posPx.y);
    setPos(perc);
  };

  // Alineación del popover (si estás cerca del borde derecho, abre a la izquierda)
  const openToLeft = posPx.x > window.innerWidth - 160;

  // Abre QuickView (respeta prop opcional y evento global)
  const openQuickView = () => {
    setExpanded(false);
    if (typeof onOpenCart === "function") {
      onOpenCart();
    } else {
      window.dispatchEvent(new Event("cart:quickview:open"));
    }
  };

  if (!count) return null;

  return (
    <>
      {/* Wrapper fijo con pointer-events habilitados */}
      <div
        ref={wrapRef}
        className="fixed z-[80] select-none"
        style={{
          left: Math.round(posPx.x),
          top: Math.round(posPx.y),
          width: SIZE,
          height: SIZE,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Botón */}
        <button
          type="button"
          className="relative w-full h-full rounded-full bg-pink-500 shadow-lg text-white grid place-items-center active:scale-[0.98] transition"
          aria-label="Abrir carrito"
        >
          <FaShoppingCart className="text-lg" />
          {/* Badge */}
          <span className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs w-5 h-5 grid place-items-center rounded-full font-bold shadow">
            {count}
          </span>
        </button>

        {/* Popover */}
        {expanded && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[220px] max-w-[70vw] bg-white text-purple-900 rounded-2xl shadow-xl border border-purple-100 p-3"
            style={
              openToLeft
                ? { right: SIZE + 8 } // a la izquierda del FAB
                : { left: SIZE + 8 }  // a la derecha del FAB
            }
          >
            <div className="text-[13px] font-semibold flex items-center gap-2">
              <FaShoppingCart /> Ver carrito
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Subtotal: <strong>S/ {Number(subtotal || 0).toFixed(2)}</strong>
            </div>
            <button
              onClick={openQuickView}
              className="mt-2 w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 text-sm font-semibold"
            >
              Abrir
            </button>
          </div>
        )}
      </div>

      {/* zona “tap-outside” para cerrar popover si quieres (opcional) */}
      {expanded && (
        <div
          className="fixed inset-0 z-[70]"
          onClick={() => setExpanded(false)}
        />
      )}
    </>
  );
}
