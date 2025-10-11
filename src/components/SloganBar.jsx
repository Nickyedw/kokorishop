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
  /** "contained" = banda con bordes redondeados dentro del layout
   *  "full"       = ocupa todo el ancho
   */
  variant = "contained",
  /** Visual:
   *  "solid" = banda completa con patrón Kuromi + texto (recomendado)
   *  "chip"  = pastilla de vidrio sobre la banda
   */
  mode = "solid",
  /** Tema */
  theme = "kuromi", // "kuromi" | "soft"
  className = "mt-1",
  maxW = "max-w-6xl",
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const total = Math.max(messages.length, 1);

  const step = useCallback(() => {
    if (reduced) return setIdx((v) => (v + 1) % total);
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

  // ===== Fondos =====
  const kuromiBg = useMemo(
    () => ({
      backgroundImage: `
        radial-gradient(120% 100% at 0% 0%, rgba(244,114,182,0.18), rgba(244,114,182,0) 60%),
        radial-gradient(120% 120% at 100% 0%, rgba(147,51,234,0.20), rgba(147,51,234,0) 60%),
        radial-gradient(100% 100% at 50% 100%, rgba(168,85,247,0.18), rgba(168,85,247,0) 50%),
        /* rayas suaves y espaciadas */
        repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 10px),
        linear-gradient(90deg, #18181b, #2a143c 55%, #1f0f2c)
      `,
    }),
    []
  );

  const softBg = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(90deg, #5b21b6 0%, #8b5cf6 55%, #ec4899 100%)",
    }),
    []
  );

  const bgStyle = theme === "kuromi" ? kuromiBg : softBg;

  // ===== Atoms =====
  const Text = (
    <span
      className="leading-none tracking-tight text-[clamp(13px,3.4vw,17px)] font-semibold"
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${fade}ms ease-in-out` }}
      aria-live="polite"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {messages[idx]}
    </span>
  );

  const Chip = (
    <div
      className="
        inline-flex items-center rounded-full px-4 py-1
        bg-white/14 border border-white/25 text-white
        shadow-[0_2px_12px_rgba(0,0,0,.15)] backdrop-blur-sm
      "
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${fade}ms ease-in-out` }}
      aria-live="polite"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {messages[idx]}
    </div>
  );

  // ===== Render helpers =====
  const Inner =
    mode === "chip" ? (
      <div className="px-4 py-2 flex justify-center">{Chip}</div>
    ) : (
      <div className="px-4 py-2">
        <div
          className="
            w-full text-center text-white
            py-2.5 md:py-3 rounded-xl
          "
          style={{
            // “satin” más claro + mejor contraste y legibilidad
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -8px 18px rgba(0,0,0,0.16)",
            textShadow: "0 1px 2px rgba(0,0,0,0.35)",
          }}
        >
          {Text}
        </div>
      </div>
    );

  const Container = (
    <div
      className="relative rounded-2xl shadow-inner ring-1 ring-fuchsia-300/30"
      style={bgStyle}
    >
      {/* halo sutil */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl blur-[6px] ring-2 ring-fuchsia-400/15" />
      {/* borde “nítido” */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-fuchsia-300/30" />
      {Inner}
    </div>
  );

  // ===== Variants =====
  if (variant === "contained") {
    return (
      <div className={`${maxW} mx-auto px-4 ${className}`}>
        {Container}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`w-full relative ${className}`} style={bgStyle}>
        <div className="pointer-events-none absolute inset-0 ring-1 ring-fuchsia-300/15" />
        <div className={`${maxW} mx-auto px-4`}>{Inner}</div>
      </div>
    );
  }

  // Fallback
  return (
    <div className={`${maxW} mx-auto px-4 ${className}`}>
      {Container}
    </div>
  );
}
