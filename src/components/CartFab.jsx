// src/components/CartFab.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useCartTotals from "../hooks/useCartTotals";

/**
 * FAB flotante del carrito:
 * - Arrastrable (touch/mouse) con "touch-action: none" para que no haga scroll
 * - Tap abre el MiniCart
 * - Recuerda posición en localStorage (porcentual)
 */
export default function CartFab({ onOpenCart }) {
  const { count, subtotal } = useCartTotals();

  // pos guardada en % (viewport), para que funcione en distintas pantallas
  const [pos, setPos] = useState(() => {
    try {
      const s = localStorage.getItem("cartfab_pos");
      return s ? JSON.parse(s) : { xPerc: 84, yPerc: 70 }; // por defecto, a media altura derecha
    } catch {
      return { xPerc: 84, yPerc: 70 };
    }
  });

  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const holderRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef({ sx: 0, sy: 0, dx: 0, dy: 0, moved: false });

  // Mostrar breve “toast” con subtotal al agregar
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

  // Guardar posición cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem("cartfab_pos", JSON.stringify(pos));
    } catch {/* noop */}
  }, [pos]);

  // Drag (pointer events)
  const onPointerDown = (e) => {
    // evita scroll mientras arrastras
    e.preventDefault();
    const r = holderRef.current?.getBoundingClientRect();
    startRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      dx: r ? e.clientX - r.left : 0,
      dy: r ? e.clientY - r.top : 0,
      moved: false,
    };
    setDragging(true);
    holderRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const { sx, sy, dx, dy } = startRef.current;

    const moveX = Math.abs(e.clientX - sx);
    const moveY = Math.abs(e.clientY - sy);
    if (moveX > 4 || moveY > 4) startRef.current.moved = true;

    const vw = Math.max(320, window.innerWidth || 320);
    const vh = Math.max(480, window.innerHeight || 480);

    // posición “top/left” en px, limitada a la pantalla
    let x = e.clientX - dx;
    let y = e.clientY - dy;

    const size = 64; // aprox tamaño del botón
    x = Math.max(8, Math.min(vw - size - 8, x));
    y = Math.max(8, Math.min(vh - size - 8, y));

    setPos({ xPerc: (x / vw) * 100, yPerc: (y / vh) * 100 });
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    holderRef.current?.releasePointerCapture?.(e.pointerId);
    setDragging(false);

    // Si no hubo movimiento real, lo consideramos un tap → abrir carrito
    if (!startRef.current.moved) {
      if (typeof onOpenCart === "function") onOpenCart();
      else window.dispatchEvent(new CustomEvent("minicart:open"));
    }
  };

  if (!count) return null;

  // estilos inline para posicionar y permitir drag correcto en móvil
  const style = {
    left: `calc(${pos.xPerc}vw)`,
    top: `calc(${pos.yPerc}vh)`,
    touchAction: "none",        // ¡muy importante para drag en mobile!
    userSelect: "none",
  };

  return (
    <div
      ref={holderRef}
      className="fixed z-[9999] -translate-x-1/2 -translate-y-1/2"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Botón principal */}
      <button
        type="button"
        className="relative grid place-items-center w-14 h-14 rounded-full bg-pink-500 text-white shadow-lg active:scale-95 transition"
        aria-label="Abrir carrito"
      >
        <FaShoppingCart className="text-xl" />
        <span className="absolute -top-1 -right-1 w-6 h-6 grid place-items-center text-xs rounded-full bg-yellow-300 text-purple-900 font-bold shadow">
          {count}
        </span>
      </button>

      {/* Globito de subtotal (solo cuando 'expanded' = true) */}
      {expanded && (
        <div className="absolute -left-2 -top-6 translate-y-[-100%] bg-black/80 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
          Subtotal: S/ {Number(subtotal || 0).toFixed(2)}
        </div>
      )}
    </div>
  );
}
