// src/components/WhatsAppFab.jsx
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

const PHONE = import.meta.env.VITE_WHATSAPP_PHONE || ""; // ej: 51999999999 (sin +)
const DEFAULT_MSG =
  import.meta.env.VITE_WHATSAPP_DEFAULT_MSG ||
  "Hola 👋, tengo una consulta sobre un producto de KokoriShop.";

export default function WhatsAppFab({
  phone = PHONE,
  msg = DEFAULT_MSG,
  // offsets base (puedes ajustarlos si gustas)
  baseBottom = 16,
  baseLeft = 16,
}) {
  const { pathname } = useLocation();

  // Si estamos en /catalogo, levantamos el FAB ~80px para no tapar el botón Home
  const extraBottom = useMemo(() => {
    return pathname.startsWith("/catalogo") ? 80 : 0;
  }, [pathname]);

  if (!phone) return null;

  const waHref = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatea por WhatsApp"
      className="
        fixed
        z-[950]               /* por debajo del CartFab (1000), por encima del contenido */
        w-14 h-14
        grid place-items-center
        rounded-full
        bg-[#25D366]
        text-white
        shadow-xl
        border-2 border-white/80
        transition-transform active:scale-95
      "
      style={{
        left: `${baseLeft}px`,
        // combinamos safe-area + extra sólo si hace falta
        bottom: `calc(${baseBottom + extraBottom}px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <FaWhatsapp className="text-2xl" />
    </a>
  );
}
