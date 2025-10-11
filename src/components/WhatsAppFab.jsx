// src/components/WhatsAppFab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

/**
 * Orden de prioridad del número:
 * 1) VITE_WHATSAPP_PHONE (build time)
 * 2) localStorage.wa_phone (runtime)
 * 3) Fallback (déjalo vacío o pon uno temporal SOLO para pruebas)
 */
function getRawPhone() {
  const envPhone = import.meta.env.VITE_WHATSAPP_PHONE;
  const lsPhone = (() => {
    try { return localStorage.getItem("wa_phone") || ""; } catch { return ""; }
  })();
  const fallback = "51977546073"; // p.ej. "51987654321" SOLO para pruebas locales
  return (envPhone || lsPhone || fallback || "").trim();
}

const DEFAULT_MSG =
  import.meta.env.VITE_WHATSAPP_DEFAULT_MSG ||
  "Hola 👋, tengo una consulta sobre un producto de KokoriShop.";

function buildWaLink() {
  const raw = getRawPhone().replace(/[^\d]/g, ""); // sólo dígitos
  if (!raw) {
    console.warn(
      "[WhatsAppFab] No hay número configurado. Define VITE_WHATSAPP_PHONE o localStorage.wa_phone"
    );
    return null;
  }
  const text = encodeURIComponent(DEFAULT_MSG);
  return `https://wa.me/${raw}?text=${text}`;
}

// Configurables por .env (con valores por defecto)
const TEASER_INTERVAL_SEC = Number(
  import.meta.env.VITE_WHATSAPP_TEASER_INTERVAL_SEC ?? 60
);
const TEASER_DURATION_MS = Number(
  import.meta.env.VITE_WHATSAPP_TEASER_DURATION_MS ?? 4000
);
const CLICK_SNOOZE_SEC = Number(
  import.meta.env.VITE_WHATSAPP_CLICK_SNOOZE_SEC ?? 300
);

// LocalStorage keys
const LS_TEASER_LAST = "wa_teaser_last_ts";
const LS_CLICK_LAST = "wa_last_click_ts";

export default function WhatsAppFab() {
  const href = buildWaLink();
  const { pathname } = useLocation();

  // Mostrar solo en Home (contempla algunos alias)
  const isHome = pathname === "/" || pathname === "" || pathname === "/home" || pathname === "/inicio" || pathname === "/catalogo";

  // Subir el botón en iOS por el safe area
  const bottomCalc = "calc(16px + env(safe-area-inset-bottom, 0px))";

  // Teaser (globo)
  const [showTeaser, setShowTeaser] = useState(false);

  // ¿Usuario prefiere menos movimiento?
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Reloj para mostrar el teaser de manera espaciada
  useEffect(() => {
    if (!href || !isHome) return;

    let hideTimer = null;
    const now = () => Date.now();
    const getTs = (k) => {
      try { return Number(localStorage.getItem(k) || 0); } catch { return 0; }
    };
    const setTs = (k, v) => {
      try { localStorage.setItem(k, String(v)); } catch {/* noop */}
    };

    const maybeShowTeaser = () => {
      // 1) si el usuario clickeó hace poco, no molestar
      const lastClick = getTs(LS_CLICK_LAST);
      if (lastClick && now() - lastClick < CLICK_SNOOZE_SEC * 1000) return;

      // 2) respeta intervalo mínimo entre apariciones
      const lastTeaser = getTs(LS_TEASER_LAST);
      if (lastTeaser && now() - lastTeaser < TEASER_INTERVAL_SEC * 1000) return;

      // 3) mostrar teaser
      setShowTeaser(true);
      setTs(LS_TEASER_LAST, now());

      // 4) auto-ocultar
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowTeaser(false), TEASER_DURATION_MS);
    };

    // Chequeo inmediato y luego cada 1s para decidir si mostrar
    maybeShowTeaser();
    const interval = setInterval(maybeShowTeaser, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(hideTimer);
    };
  }, [href, isHome]);

  if (!href || !isHome) return null;

  return (
    <>
      {/* animación sutil (solo cuando no hay prefers-reduced-motion) */}
      {!reduceMotion && (
        <style>{`
          @keyframes koko-bounce-soft {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
        `}</style>
      )}

      <div
        className="fixed z-[950] left-4 md:left-6"
        style={{ bottom: bottomCalc }}
      >
        {/* TEASER (globo) */}
        {showTeaser && (
          <div
            className={`
              mb-2 select-none rounded-2xl bg-white text-purple-900 shadow-xl
              ring-1 ring-black/5 px-3 py-2 text-[13px] font-medium
              ${reduceMotion ? "" : "animate-[koko-bounce-soft_1.2s_ease-in-out_infinite]"}
            `}
            role="status"
          >
            Cualquier consulta, escríbenos a <strong>KokoriShop</strong> 💬
          </div>
        )}

        {/* FAB */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chatea por WhatsApp"
          title="¿Dudas? Escríbenos por WhatsApp"
          className="
            w-14 h-14 rounded-full grid place-items-center
            bg-[#25D366] text-white shadow-2xl border-2 border-white/70
            hover:brightness-110 active:scale-95 transition pointer-events-auto
          "
          onClick={() => {
            // Guarda el click para “snoozear” futuros teasers
            try { localStorage.setItem(LS_CLICK_LAST, String(Date.now())); } catch {/* noop */}
            setShowTeaser(false);
          }}
        >
          <FaWhatsapp className="text-2xl" />
          <span className="sr-only">WhatsApp</span>
        </a>
      </div>
    </>
  );
}
