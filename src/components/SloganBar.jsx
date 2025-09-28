// src/components/SloganBar.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Barra de slogan full-width con rotación cross-fade sin framer-motion.
 * - Respeta prefers-reduced-motion.
 * - Pausa al pasar el mouse (desktop) y cuando la pestaña está oculta.
 */
export default function SloganBar({
  messages = [
    "Donde todo es Cute",
    "¡Novedades kawaii cada semana! ✨",
    "Envíos a todo el Perú 🚚",
  ],
  interval = 4500, // ms entre mensajes
  fade = 450,      // ms de cross-fade
  pauseOnHover = true,
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const total = Math.max(messages.length, 1);

  const step = () => {
    if (reduced) {
      setIdx((v) => (v + 1) % total);
      return;
    }
    // cross-fade: oculta, cambia el texto y vuelve a mostrar
    setVisible(false);
    setTimeout(() => {
      setIdx((v) => (v + 1) % total);
      setVisible(true);
    }, fade);
  };

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
  }, [interval, fade, reduced, total]);

  // pausa al hover (solo desktop)
  const onMouseEnter = () => {
    if (!pauseOnHover || reduced) return;
    clearInterval(timerRef.current);
  };
  const onMouseLeave = () => {
    if (!pauseOnHover || reduced) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(step, Math.max(interval, 1200));
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-700 to-fuchsia-700">
      <div
        className="max-w-7xl mx-auto px-4 py-2 flex justify-center"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          className={`inline-flex items-center rounded-full px-4 py-1
                      bg-black/35 text-white shadow-md backdrop-blur-sm
                      leading-none whitespace-nowrap tracking-tight
                      text-[clamp(12px,3.2vw,16px)]
                      transition-opacity ease-in-out`}
          style={{
            opacity: visible ? 1 : 0,
            transitionDuration: `${fade}ms`,
          }}
          aria-live="polite"
        >
          {messages[idx]}
        </div>
      </div>
    </div>
  );
}
