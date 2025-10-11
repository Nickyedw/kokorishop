// src/components/ImageZoom.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  FaTimes,
  FaPlus,
  FaMinus,
  FaUndo,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
} from "react-icons/fa";

const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

/**
 * ImageZoom – visor con zoom, galería, swipe, wheel y pinch
 */
export default function ImageZoom({
  isOpen,
  src,
  images,
  initialIndex = 0,
  alt = "",
  onClose,
  getFullSrc,
  onAdd,
  addLabel = "Agregar al carrito",

  /** NUEVO (opcional): datos para mostrar debajo de la imagen */
  info, // { name, price, description }
}) {
  const backdropRef = useRef(null);
  const imgRef = useRef(null);

  // Normalizar lista de imágenes
  const list = useMemo(() => {
    const arr = images?.length ? images : (src ? [src] : []);
    return arr.filter(Boolean);
  }, [images, src]);

  // Índice actual
  const [index, setIndex] = useState(0);
  // Estado de carga
  const [loading, setLoading] = useState(true);
  // Transformaciones (zoom / pan)
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Arrastre con puntero
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const lastPointerId = useRef(null); // pointer capturado para liberarlo al cerrar

  // Pinch-to-zoom (2 dedos)
  const pointers = useRef(new Map()); // id -> {x,y}
  const pinchStart = useRef({
    dist: 0,
    scale: 1,
    center: { x: 0, y: 0 },
    pos: { x: 0, y: 0 },
  });

  // Swipe (cambio de imagen cuando no hay zoom)
  const swipeStart = useRef({ x: 0, y: 0, at: 0 });

  // Descripción expandida
  const [descOpen, setDescOpen] = useState(false);

  // Cerrar centralizado (libera capture + resetea mínimos)
  const handleClose = useCallback(() => {
    try {
      if (lastPointerId.current != null) {
        imgRef.current?.releasePointerCapture?.(lastPointerId.current);
        lastPointerId.current = null;
      }
    } catch { /* noop */ }
    setDragging(false);
    pointers.current.clear();
    onClose?.();
  }, [onClose]);

  // Inicializa índice cuando se abre o cambia la lista
  useEffect(() => {
    if (!isOpen) return;
    const max = Math.max(0, list.length - 1);
    const safe = Math.min(Math.max(0, initialIndex), max);
    setIndex(safe);
    setScale(1);
    setPos({ x: 0, y: 0 });
    setLoading(true);
    setDescOpen(false);
  }, [isOpen, list.length, initialIndex]);

  // Navegación (wrap-around)
  const next = useCallback(() => {
    setIndex((i) => (list.length ? (i + 1) % list.length : 0));
  }, [list.length]);

  const prev = useCallback(() => {
    setIndex((i) => (list.length ? (i - 1 + list.length) % list.length : 0));
  }, [list.length]);

  // ESC, flechas, +/- y 0
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (!list.length) return;
      if (e.key === "Escape") { e.preventDefault(); handleClose(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "+") { e.preventDefault(); setScale((s) => Math.min(5, s + 0.25)); }
      else if (e.key === "-") { e.preventDefault(); setScale((s) => Math.max(1, s - 0.25)); }
      else if (e.key === "0") { e.preventDefault(); setScale(1); setPos({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, list.length, next, prev, handleClose]);

  // Reset al cambiar de imagen
  useEffect(() => {
    if (!isOpen) return;
    setScale(1);
    setPos({ x: 0, y: 0 });
    setLoading(true);
  }, [isOpen, index]);

  const currentSrc = useMemo(() => {
    if (!list.length) return "";
    const base = list[index] || list[0];
    return getFullSrc ? getFullSrc(base) : base;
  }, [list, index, getFullSrc]);

  // Precarga vecinos
  useEffect(() => {
    if (!list.length) return;
    const preload = (i) => {
      const s = getFullSrc ? getFullSrc(list[i]) : list[i];
      const img = new Image();
      img.src = s;
    };
    if (index + 1 < list.length) preload(index + 1);
    if (index - 1 >= 0) preload(index - 1);
  }, [index, list, getFullSrc]);

  if (!isOpen || !list.length) return null;

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) handleClose();
  };

  const zoomIn = () => setScale((s) => Math.min(5, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(1, s - 0.25));
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  // Wheel zoom con centrado aproximado
  const onWheel = (e) => {
    e.preventDefault();
    const rect = imgRef.current?.getBoundingClientRect();
    const cx = e.clientX - (rect?.left ?? 0);
    const cy = e.clientY - (rect?.top ?? 0);
    const delta = -Math.sign(e.deltaY) * 0.25;

    setScale((s) => {
      const nextScale = Math.max(1, Math.min(5, s + delta));
      if (rect) {
        const ratio = nextScale / s;
        setPos((p) => ({
          x: (p.x - cx) * ratio + cx,
          y: (p.y - cy) * ratio + cy,
        }));
      }
      return nextScale;
    });
  };

  // Pointer para drag y pinch
  const onPointerDown = (e) => {
    lastPointerId.current = e.pointerId; // guardamos el id capturado
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      // pinch start
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      pinchStart.current = { dist, scale, center, pos: { ...pos } };
    } else if (pointers.current.size === 1) {
      // drag start
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      posStart.current = { ...pos };
      imgRef.current?.setPointerCapture?.(e.pointerId);

      // swipe start (si scale=1)
      swipeStart.current = { x: e.clientX, y: e.clientY, at: Date.now() };
    }
  };

  const onPointerMove = (e) => {
    // actualizar posición del puntero
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // pinch
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinchStart.current.dist || 1);
      const nextScale = Math.max(1, Math.min(5, (pinchStart.current.scale || 1) * ratio));
      setScale(nextScale);

      const rect = imgRef.current?.getBoundingClientRect();
      if (rect) {
        const { center } = pinchStart.current;
        const cx = center.x - rect.left;
        const cy = center.y - rect.top;
        const scaleRatio = nextScale / (pinchStart.current.scale || 1);

        setPos({
          x: (pinchStart.current.pos.x - cx) * scaleRatio + cx,
          y: (pinchStart.current.pos.y - cy) * scaleRatio + cy,
        });
      }
      return;
    }

    // drag
    if (!dragging || scale <= 1) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({ x: posStart.current.x + dx, y: posStart.current.y + dy });
  };

  const onPointerUp = (e) => {
    // swipe para cambiar imagen si no hay zoom
    if (pointers.current.size === 1 && scale === 1) {
      const dx = e.clientX - swipeStart.current.x;
      const dt = Date.now() - swipeStart.current.at;
      const isSwipe = Math.abs(dx) > 60 && dt < 500;
      if (isSwipe) (dx < 0 ? next : prev)();
    }

    setDragging(false);
    try {
      if (lastPointerId.current != null) {
        imgRef.current?.releasePointerCapture?.(lastPointerId.current);
        lastPointerId.current = null;
      }
    } catch { /* noop */ }
    pointers.current.delete(e.pointerId);

    // reset pinch ref si queda 1 o 0 dedos
    if (pointers.current.size < 2) {
      pinchStart.current.dist = 0;
      pinchStart.current.scale = scale;
      pinchStart.current.pos = { ...pos };
    }
  };

  const handleLoad = () => setLoading(false);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Contenedor */}
      <div className="relative max-w-[95vw] max-h-[88vh] w-full h-full flex items-center justify-center p-4">
        {/* Botón Cerrar */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()} // evita que el backdrop capture antes del click
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          aria-label="Cerrar"
          title="Cerrar"
        >
          <FaTimes />
        </button>

        {/* Flechas (desktop) */}
        {list.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-20"
              aria-label="Anterior"
              title="Anterior"
              type="button"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-20"
              aria-label="Siguiente"
              title="Siguiente"
              type="button"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        {/* Contenido imagen */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Spinner */}
          {loading && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={() => setLoading(false)}
            className="select-none touch-none"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transformOrigin: "center center",
              maxWidth: "92vw",
              maxHeight: "80vh",
              cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
              transition: dragging ? "none" : "transform 120ms ease",
              opacity: loading ? 0 : 1,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            draggable={false}
          />
        </div>

        {/* === NUEVO: Panel de información (opcional) === */}
        {info && (info.name || info.price != null || info.description) && (
          <div
            className="
              absolute left-1/2 -translate-x-1/2
              bottom-[88px]   /* queda justo encima de la toolbar */
              w-[92%] max-w-[780px]
              bg-white text-purple-900 shadow-xl border border-purple-100
              rounded-2xl px-4 py-3
            "
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base md:text-lg font-extrabold">
                {info.name || alt || "Producto"}
              </h3>
              {info.price != null && (
                <div className="text-fuchsia-600 font-extrabold">
                  {fmt(info.price)}
                </div>
              )}
            </div>

            {info.description && (
              <div className="mt-1.5 text-sm text-purple-700/90">
                <div className={descOpen ? "" : "line-clamp-3"}>
                  {info.description}
                </div>
                {String(info.description).length > 120 && (
                  <button
                    onClick={() => setDescOpen((v) => !v)}
                    className="mt-1 text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-700"
                  >
                    {descOpen ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Toolbar inferior */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-2 text-white">
          {list.length > 1 && (
            <span className="hidden sm:inline-block text-xs opacity-80 mr-1">
              {index + 1}/{list.length}
            </span>
          )}
          <button
            onClick={zoomOut}
            className="p-2 rounded-full hover:bg-white/20"
            title="Alejar"
            aria-label="Alejar"
          >
            <FaMinus />
          </button>
          <span className="text-sm tabular-nums w-14 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 rounded-full hover:bg-white/20"
            title="Acercar"
            aria-label="Acercar"
          >
            <FaPlus />
          </button>
          <button
            onClick={reset}
            className="p-2 rounded-full hover:bg-white/20 ml-1"
            title="Restablecer"
            aria-label="Restablecer"
          >
            <FaUndo />
          </button>

          {onAdd && (
            <button
              onClick={onAdd}
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold shadow hover:shadow-md"
              title={addLabel}
            >
              <FaShoppingCart /> {addLabel}
            </button>
          )}
        </div>

        {/* Flechas móviles */}
        {list.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-20"
              aria-label="Anterior"
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-20"
              aria-label="Siguiente"
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
