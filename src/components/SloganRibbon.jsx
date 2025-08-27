// src/components/SloganRibbon.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * SloganRibbon
 * Props:
 * - text: string (default: "Donde todo es Cute")
 * - variant: "ribbon" | "banner"  (default: "ribbon")
 * - topClass: clases para posicionar verticalmente (ej. "top-5 sm:top-6")
 * - to: string opcional => si lo pasas, la cinta es clickeable y navega (Link)
 * - className: clases extra para el wrapper interior (opcional)
 */
export default function SloganRibbon({
  text = "Donde todo es Cute",
  variant = "ribbon",
  topClass,
  to,
  className = "",
}) {
  const isBanner = variant === "banner";

  // Posición del contenedor según variante
  const container = isBanner
    ? `absolute z-40 ${topClass || "top-0"} left-0 right-0 pointer-events-none`
    : `absolute z-40 ${topClass || "top-5 sm:top-6"} left-1/2 -translate-x-1/2 pointer-events-none px-3`;

  // Estilo interior según variante
  const innerBase = isBanner
    ? "glass-banner flex justify-center items-center py-2 sm:py-3"
    : "glass-ribbon inline-flex justify-center items-center px-5 sm:px-6 py-1.5 sm:py-2 min-w-[180px] sm:min-w-[220px] md:min-w-[260px] rounded-full";

  const textCls =
    "rainbow-glow text-sm sm:text-base md:text-lg font-semibold tracking-wide";

  const Inner = ({ children }) =>
    to ? (
      <Link
        to={to}
        className={`${innerBase} pointer-events-auto hover:scale-[1.03] transition-transform ${className}`}
      >
        {children}
      </Link>
    ) : (
      <div className={`${innerBase} ${className}`}>{children}</div>
    );

  return (
    <div className={container}>
      <Inner>
        <span className={textCls}>{text}</span>
      </Inner>
    </div>
  );
}
