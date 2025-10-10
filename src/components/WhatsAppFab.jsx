import React from "react";
import { FaWhatsapp } from "react-icons/fa";

// Lee los valores del .env del frontend
const RAW_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || ""; // ej: 51987654321
const DEFAULT_MSG =
  import.meta.env.VITE_WHATSAPP_DEFAULT_MSG ||
  "Hola 👋, tengo una consulta sobre un producto de KokoriShop.";

function buildWaLink() {
  // Debe ser número en formato internacional SIN el “+”.
  const phone = String(RAW_PHONE || "").trim().replace(/[^\d]/g, "");
  const text = encodeURIComponent(DEFAULT_MSG);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${text}`;
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
        fixed z-[999]
        left-4 bottom-4 md:left-6 md:bottom-6
        w-14 h-14 rounded-full
        grid place-items-center
        bg-[#25D366] text-white
        shadow-2xl border-2 border-white/70
        hover:brightness-110 active:scale-95
        transition
      "
    >
      <FaWhatsapp className="text-2xl" />
      {/* badge opcional para llamar la atención */}
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
