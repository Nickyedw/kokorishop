import React, {useEffect, useMemo, useRef, useState} from "react";

// Utilidad para formatear soles
const S = (n)=> `S/ ${Number(n||0).toFixed(2)}`;

export default function CartFab({ count=0, subtotal=0, onOpenCart }) {
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState(()=> {
    // guardamos porcentaje para que funcione en distintas pantallas
    try {
      const s = localStorage.getItem("cartfab_pos");
      return s ? JSON.parse(s) : { xPerc: 84, yPerc: 70 };
    } catch { return { xPerc: 84, yPerc: 70 }; }
  });
  const holdRef = useRef(null);
  const timerRef = useRef(null);

  // escuchar evento global para “mostrar” el subtotal al agregar
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

  // drag (con pointer events)
  useEffect(()=> {
    const el = holdRef.current;
    if (!el) return;

    let start = null;

    const onDown = (ev)=>{
      ev.preventDefault();
      setDragging(true);
      const rect = el.getBoundingClientRect();
      start = {
        x: ev.clientX, y: ev.clientY,
        left: rect.left, top: rect.top
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once:true });
    };
    const onMove = (ev)=>{
      if (!start) return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const nx = start.left + dx;
      const ny = start.top + dy;

      // a porcentaje de la ventana
      const xPerc = Math.min(95, Math.max(5, (nx / window.innerWidth) * 100));
      const yPerc = Math.min(92, Math.max(8, (ny / window.innerHeight) * 100));
      setPos({ xPerc, yPerc });
    };
    const onUp = ()=>{
      setDragging(false);
      start = null;
      localStorage.setItem("cartfab_pos", JSON.stringify(pos));
      window.removeEventListener("pointermove", onMove);
    };

    el.addEventListener("pointerdown", onDown);
    return ()=> el.removeEventListener("pointerdown", onDown);
  }, [pos]);

  const style = useMemo(()=> ({
    position: "fixed",
    left: `${pos.xPerc}%`,
    top: `${pos.yPerc}%`,
    transform: "translate(-50%,-50%)",
    zIndex: 50
  }), [pos]);

  return (
    <div ref={holdRef} style={style}>
      {/* “píldora” expandida */}
      <div
        className={`transition-all duration-200 flex items-center shadow-lg rounded-full overflow-hidden
                    ${expanded ? "bg-white border" : "bg-transparent"} ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {expanded && (
          <button
            onClick={onOpenCart}
            className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
            title="Abrir carrito"
          >
            <span className="font-medium">Ver carrito</span>
            <span className="text-gray-500">•</span>
            <span className="font-semibold">{S(subtotal)}</span>
          </button>
        )}

        {/* botón redondo */}
        <button
          onClick={onOpenCart}
          className={`relative w-12 h-12 rounded-full bg-purple-600 text-white grid place-items-center
                     hover:bg-purple-700 transition-colors ${expanded ? "m-1" : ""}`}
          aria-label="Carrito"
          title="Carrito"
        >
          {/* ícono carrito (emoji o tu ícono) */}
          <span className="text-xl">🛒</span>
          {/* badge cantidad */}
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[11px] font-bold grid place-items-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
