import { useEffect, useRef, useState, useCallback } from "react";

export default function SloganBar({
  messages = [
            "Envíos punto a punto",
            "Donde Todo es Cute ✨",
            "Atención por WhatsApp 📲",
            "Retiro en estación de bus 🚌",
  ],
  interval = 4500,
  fade = 450,
  pauseOnHover = true,
  variant = "full",         // "full" | "contained" | "chip"
  className = "",           // para márgenes externos (mt-2, etc.)
  barClass,                 // ⬅️ NUEVO: clases para el fondo de la banda
  maxW = "max-w-6xl",       // ancho interno cuando no es full bleed
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const total = Math.max(messages.length, 1);

  const step = useCallback(() => {
    if (reduced) {
      setIdx((v) => (v + 1) % total);
      return;
    }
    setVisible(false);
    setTimeout(() => {
      setIdx((v) => (v + 1) % total);
      setVisible(true);
    }, fade);
  }, [fade, reduced, total]);

  useEffect(() => {
    if (total <= 1) return;

    const tick = () => {
      if (!document.hidden) step();
    };

    clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, Math.max(interval, 1200));

    const onVis = () => {
      clearInterval(timerRef.current);
      if (!document.hidden) {
        timerRef.current = setInterval(tick, Math.max(interval, 1200));
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [interval, step, total]);

  const onMouseEnter = () => {
    if (!pauseOnHover || reduced) return;
    clearInterval(timerRef.current);
  };
  const onMouseLeave = () => {
    if (!pauseOnHover || reduced) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(step, Math.max(interval, 1200));
  };

  // Contenido (la “pastilla”)
  const Chip = (
    <div
      className="inline-flex items-center rounded-full px-4 py-1
                 bg-black/35 text-white shadow-md backdrop-blur-sm
                 leading-none whitespace-nowrap tracking-tight
                 text-[clamp(12px,3.2vw,16px)]
                 transition-opacity ease-in-out"
      style={{ opacity: visible ? 1 : 0, transitionDuration: `${fade}ms` }}
      aria-live="polite"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {messages[idx]}
    </div>
  );

  // Layouts
  if (variant === "chip") {
    return (
      <div className={`${maxW} mx-auto px-4 ${className}`}>
        <div className="flex justify-center py-2">{Chip}</div>
      </div>
    );
  }

  if (variant === "contained") {
    return (
      <div className={`${maxW} mx-auto px-4 ${className}`}>
        <div className={`rounded-xl ${barClass ?? "bg-gradient-to-r from-purple-700 to-fuchsia-700"} shadow-inner`}>
          <div className="px-4 py-2 flex justify-center">{Chip}</div>
        </div>
      </div>
    );
  }

  // default: full (ocupa todo el ancho)
  return (
    <div className={`w-full ${barClass ?? "bg-gradient-to-r from-purple-700 to-fuchsia-700"} shadow-inner ${className}`}>
      <div className={`${maxW} mx-auto px-4 py-2 flex justify-center`}>{Chip}</div>
    </div>
  );
}
