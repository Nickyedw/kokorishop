import { useEffect, useRef, useState } from "react";
import { AnimatePresence} from "framer-motion";

/**
 * Barra de slogan full-width con rotación de mensajes (cross-fade)
 * - Ancho completo con degradado animado (respetando reduces motion).
 * - Altura fija para que no salte el layout.
 * - Pausa en hover (desktop) y cuando el tab está oculto.
 */
export default function SloganBar({
  messages = ["Donde todo es Cute"],
  interval = 4500,    // ms entre mensajes
  fade = 0.45,        // duración cross-fade (s)
  pauseOnHover = true,
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const total = Math.max(messages.length, 1);
  
  useEffect(() => {
    if (total <= 1) return;

    const tick = () => {
      if (paused || document.hidden) return;
      setIdx((v) => (v + 1) % total);
    };

    const start = () => {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(tick, Math.max(interval, 1200));
    };

    start();
    const onVis = () => { clearInterval(timerRef.current); if (!document.hidden) start(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [interval, paused, total]);

  const text = messages[idx] || "";

  return (
    <div
      className="
        w-full
        bg-gradient-to-r from-fuchsia-600 via-pink-500 to-violet-600
        text-white shadow-inner
      "
      // degradado “en movimiento” (desactivado si reduce motion)
      style={{
        backgroundSize: "200% 200%",
        animation:
          "@media (prefers-reduced-motion: no-preference) { gradientMove 8s linear infinite }",
      }}
      onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="h-10 sm:h-11 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: fade }}
              className="
                font-medium text-center
                text-[clamp(12px,3.2vw,16px)]
                leading-none
                whitespace-nowrap overflow-hidden text-ellipsis
                drop-shadow-[0_1px_0_rgba(0,0,0,.35)]
              "
            >
              {text}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* keyframes inline para no tocar Tailwind config */}
      <style>{`
        @keyframes gradientMove {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
