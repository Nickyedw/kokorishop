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
  const fallback = "51977546073"; // SOLO si quieres un valor por defecto local
  return (envPhone || lsPhone || fallback || "").trim();
}

const DEFAULT_MSG =
  import.meta.env.VITE_WHATSAPP_DEFAULT_MSG ||
  "Hola 👋, tengo una consulta sobre un producto de KokoriShop.";

function buildWaLink() {
  const raw = getRawPhone().replace(/[^\d]/g, ""); // sólo dígitos
  if (!raw) {
    console.warn("[WhatsAppFab] Falta VITE_WHATSAPP_PHONE o localStorage.wa_phone");
    return null;
  }
  const text = encodeURIComponent(DEFAULT_MSG);
  return `https://wa.me/${raw}?text=${text}`;
}

// Configurables por .env (con valores por defecto)
const TEASER_INTERVAL_SEC = Number(import.meta.env.VITE_WHATSAPP_TEASER_INTERVAL_SEC ?? 60);
const TEASER_DURATION_MS  = Number(import.meta.env.VITE_WHATSAPP_TEASER_DURATION_MS  ?? 4000);
const CLICK_SNOOZE_SEC    = Number(import.meta.env.VITE_WHATSAPP_CLICK_SNOOZE_SEC    ?? 300);
// Desfase extra en /catalogo para no tapar el botón Home
const EXTRA_BOTTOM_CATALOG = Number(import.meta.env.VITE_WHATSAPP_EXTRA_BOTTOM_CATALOG ?? 88);

// LocalStorage keys
const LS_TEASER_LAST = "wa_teaser_last_ts";
const LS_CLICK_LAST  = "wa_last_click_ts";

export default function WhatsAppFab() {
  const href = buildWaLink();
  const { pathname } = useLocation();

  // Rutas donde sí queremos mostrarlo
  const isAllowedRoute =
    pathname === "/" ||
    pathname === "" ||
    pathname === "/home" ||
    pathname === "/inicio" ||
    pathname.startsWith("/catalogo");

  // Si estamos en catálogo, levantamos el botón para que no se solape con el FAB Home
  const needsLift = pathname.startsWith("/catalogo");
  const extraBottom = needsLift ? EXTRA_BOTTOM_CATALOG : 0;

  // baseBottom=16px; añadimos safe-area (iOS) + extraBottom cuando haga falta
  const bottomCalc = `calc(16px + ${extraBottom}px + env(safe-area-inset-bottom, 0px))`;

  // Teaser (globo)
  const [showTeaser, setShowTeaser] = useState(false);

  // ¿Usuario prefiere menos movimiento?
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Mostrar teaser cada cierto tiempo (con snooze si el usuario clickeó)
  useEffect(() => {
    if (!href || !isAllowedRoute) return;

    let hideTimer = null;
    const now = () => Date.now();
    const getTs = (k) => { try { return Number(localStorage.getItem(k) || 0); } catch { return 0; } };
    const setTs = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {/* noop */} };

    const maybeShowTeaser = () => {
      const lastClick  = getTs(LS_CLICK_LAST);
      if (lastClick && now() - lastClick < CLICK_SNOOZE_SEC * 1000) return;

      const lastTeaser = getTs(LS_TEASER_LAST);
      if (lastTeaser && now() - lastTeaser < TEASER_INTERVAL_SEC * 1000) return;

      setShowTeaser(true);
      setTs(LS_TEASER_LAST, now());

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
  }, [href, isAllowedRoute]);

  if (!href || !isAllowedRoute) return null;

  return (
    <>
      {!reduceMotion && (
        <style>{`
          @keyframes koko-bounce-soft {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-3px); }
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
