import React from "react";
import { FaWhatsapp } from "react-icons/fa";

/**
 * Orden de prioridad del número:
 * 1) VITE_WHATSAPP_PHONE (build time)
 * 2) localStorage.wa_phone (runtime)
 * 3) Fallback hardcodeado (cámbialo y quítalo cuando tengas el .env ok)
 */
function getRawPhone() {
  const envPhone = import.meta.env.VITE_WHATSAPP_PHONE;
  const lsPhone = (() => {
    try { return localStorage.getItem("wa_phone") || ""; } catch { return ""; }
  })();
  const fallback = "51977546073"; // <-- opcionalmente pon aquí "51987654321" solo para probar

  return (envPhone || lsPhone || fallback || "").trim();
}

const DEFAULT_MSG =
  import.meta.env.VITE_WHATSAPP_DEFAULT_MSG ||
  "Hola 👋, tengo una consulta sobre un producto de KokoriShop.";

function buildWaLink() {
  const raw = getRawPhone().replace(/[^\d]/g, ""); // solo dígitos, sin '+'
  if (!raw) {
    console.warn(
      "[WhatsAppFab] No hay número configurado. Define VITE_WHATSAPP_PHONE o localStorage.wa_phone"
    );
    return null;
  }
  const text = encodeURIComponent(DEFAULT_MSG);
  return `https://wa.me/${raw}?text=${text}`;
}

export default function WhatsAppFab() {
  const href = buildWaLink();
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatea por WhatsApp"
      title="¿Dudas? Escríbenos por WhatsApp"
      className="
        fixed z-[2000]
        left-4 bottom-4 md:left-6 md:bottom-6
        w-14 h-14 rounded-full
        grid place-items-center
        bg-[#25D366] text-white
        shadow-2xl border-2 border-white/70
        hover:brightness-110 active:scale-95
        transition pointer-events-auto
      "
    >
      <FaWhatsapp className="text-2xl" />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
