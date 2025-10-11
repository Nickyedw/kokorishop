// src/components/SloganBar.jsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

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
  variant = "full",          // "contained" | "chip" | "full"
  className = "mt-1",
  maxW = "max-w-6xl",
  /** Nuevo: tema visual */
  theme = "kuromi",               // "kuromi" | "soft"
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const total = Math.max(messages.length, 1);

  const step = useCallback(() => {
    if (reduced) return setIdx(v => (v + 1) % total);
    setVisible(false);
    setTimeout(() => { setIdx(v => (v + 1) % total); setVisible(true); }, fade);
  }, [fade, reduced, total]);

  useEffect(() => {
    if (total <= 1) return;
    const tick = () => { if (!document.hidden) step(); };
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

  // Fondo Kuromi (oscuro + brillos + puntitos)
  const kuromiBg = useMemo(
    () => ({
      backgroundImage: `
        radial-gradient(120% 100% at 0% 0%, rgba(244,114,182,0.20), rgba(244,114,182,0) 60%),
        radial-gradient(120% 120% at 100% 0%, rgba(147,51,234,0.22), rgba(147,51,234,0) 60%),
        radial-gradient(100% 100% at 50% 100%, rgba(168,85,247,0.22), rgba(168,85,247,0) 50%),
        repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 8px),
        linear-gradient(90deg, #18181b, #2a143c 55%, #1f0f2c)
      `,
    }),
    []
  );

  // Fondo suave (tu gradiente anterior)
  const softBg = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(90deg, #5b21b6 0%, #8b5cf6 55%, #ec4899 100%)",
    }),
    []
  );

  const bgStyle = theme === "kuromi" ? kuromiBg : softBg;

  // Pastilla (chip) con glass
  const Chip = (
    <div
      className="
        inline-flex items-center rounded-full px-4 py-1
        bg-white/14 border border-white/25
        text-white shadow-[0_2px_12px_rgba(0,0,0,.15)]
        backdrop-blur-sm
        leading-none whitespace-nowrap tracking-tight
        text-[clamp(12px,3.2vw,16px)]
        transition-opacity ease-in-out
      "
      style={{ opacity: visible ? 1 : 0, transitionDuration: `${fade}ms` }}
      aria-live="polite"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {messages[idx]}
    </div>
  );

  // Contained (banda con relleno)
  if (variant === "contained") {
    return (
      <div className={`${maxW} mx-auto px-4 ${className}`}>
        <div
          className="
            relative rounded-2xl shadow-inner
            ring-1 ring-white/10
          "
          style={bgStyle}
        >
          {/* Borde neón sutil */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-fuchsia-300/20" />
          <div className="px-4 py-2 flex justify-center">{Chip}</div>
        </div>
      </div>
    );
  }

  // Variante chip centrada
  if (variant === "chip") {
    return (
      <div className={`${maxW} mx-auto px-4 ${className}`}>
        <div className="flex justify-center py-2">{Chip}</div>
      </div>
    );
  }

  // Full-width
  return (
    <div
      className={`w-full shadow-inner ${className}`}
      style={bgStyle}
    >
      <div className={`${maxW} mx-auto px-4 py-2 flex justify-center`}>
        {Chip}
      </div>
    </div>
  );
}
