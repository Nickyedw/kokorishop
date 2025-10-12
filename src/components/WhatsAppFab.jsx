// src/components/WhatsAppFab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

/* ===== helpers ===== */
function getRawPhone() {
  const envPhone = import.meta.env.VITE_WHATSAPP_PHONE;
  const lsPhone = (() => {
    try { return localStorage.getItem("wa_phone") || ""; } catch { return ""; }
  })();
  const fallback = "51977546073"; // quítalo si ya tienes el .env en producción
  return (envPhone || lsPhone || fallback || "").trim();
}
const DEFAULT_MSG =
  import.meta.env.VITE_WHATSAPP_DEFAULT_MSG ||
  "Hola 👋, tengo una consulta sobre un producto de KokoriShop.";

function buildWaLink() {
  const raw = getRawPhone().replace(/[^\d]/g, "");
  if (!raw) return null;
  const text = encodeURIComponent(DEFAULT_MSG);
  return `https://wa.me/${raw}?text=${text}`;
}

/* ===== config por .env ===== */
const TEASER_INTERVAL_SEC = Number(import.meta.env.VITE_WHATSAPP_TEASER_INTERVAL_SEC ?? 60);
const TEASER_DURATION_MS = Number(import.meta.env.VITE_WHATSAPP_TEASER_DURATION_MS ?? 4000);
const CLICK_SNOOZE_SEC   = Number(import.meta.env.VITE_WHATSAPP_CLICK_SNOOZE_SEC ?? 300);
const THEME = (import.meta.env.VITE_WHATSAPP_THEME || "kuromi").toLowerCase();

/* ===== keys localStorage ===== */
const LS_TEASER_LAST = "wa_teaser_last_ts";
const LS_CLICK_LAST  = "wa_last_click_ts";

/* ===== paletas ===== */
const themes = {
  kuromi: {
    bubble:
      "bg-gradient-to-r from-[#111111] to-[#3a0b45] text-white ring-1 ring-pink-400/60 shadow-[0_8px_24px_rgba(255,20,147,.25)]",
    pill: "bg-pink-500 text-white",
    edge: "border border-pink-400/50",
    tail: "bg-[#3a0b45]",
  },
  classic: {
    bubble:
      "bg-white text-purple-900 ring-1 ring-black/5 shadow-xl",
    pill: "bg-fuchsia-600 text-white",
    edge: "border border-white/20",
    tail: "bg-white",
  },
  panda: {
    bubble:
      "bg-gradient-to-r from-[#0b1220] to-[#1f2a44] text-white ring-1 ring-emerald-400/60 shadow-[0_8px_24px_rgba(16,185,129,.25)]",
    pill: "bg-emerald-500 text-white",
    edge: "border border-emerald-400/40",
    tail: "bg-[#1f2a44]",
  },
};

export default function WhatsAppFab() {
  const href = buildWaLink();
  const { pathname } = useLocation();
  const isHome =
    pathname === "/" || pathname === "" || pathname === "/home" || pathname === "/inicio" || pathname === "/catalogo";

  // sube el FAB un poco en catálogo para no pisar el Home flotante
  const bottomCalc = useMemo(() => {
    const extra = pathname.startsWith("/catalogo") ? 84 : 0;
    return `calc(16px + ${extra}px + env(safe-area-inset-bottom, 0px))`;
  }, [pathname]);

  const [showTeaser, setShowTeaser] = useState(false);
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!href || !isHome) return;
    let hideTimer = null;
    const now = () => Date.now();
    const getTs = (k) => { try { return Number(localStorage.getItem(k) || 0); } catch { return 0; } };
    const setTs = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {/* noop */} };

    const maybeShow = () => {
      const lastClick = getTs(LS_CLICK_LAST);
      if (lastClick && now() - lastClick < CLICK_SNOOZE_SEC * 1000) return;
      const lastTeaser = getTs(LS_TEASER_LAST);
      if (lastTeaser && now() - lastTeaser < TEASER_INTERVAL_SEC * 1000) return;

      setShowTeaser(true);
      setTs(LS_TEASER_LAST, now());
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowTeaser(false), TEASER_DURATION_MS);
    };

    maybeShow();
    const id = setInterval(maybeShow, 1000);
    return () => { clearInterval(id); clearTimeout(hideTimer); };
  }, [href, isHome]);

  if (!href || !isHome) return null;

  const t = themes[THEME] || themes.kuromi;

  return (
    <>
      {!reduceMotion && (
        <style>{`
          @keyframes wsoft-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        `}</style>
      )}

      <div className="fixed z-[950] left-4 md:left-6" style={{ bottom: bottomCalc }}>
        {/* teaser/globo */}
        {showTeaser && (
          <div
            className={[
              "relative mb-2 select-none rounded-2xl px-3 py-2 text-[13px] font-medium",
              t.bubble, t.edge,
              reduceMotion ? "" : "animate-[wsoft-bounce_1.2s_ease-in-out_infinite]"
            ].join(" ")}
            role="status"
          >
            <button
              onClick={() => setShowTeaser(false)}
              className="absolute -right-2 -top-2 w-6 h-6 grid place-items-center rounded-full bg-white/20 hover:bg-white/30 text-white"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ×
            </button>

            <div className="flex items-center gap-2">
              <span>💬 Cualquier consulta, escríbenos a</span>
              <span className={`px-2 py-[2px] rounded-full text-[12px] font-semibold ${t.pill}`}>
                KokoriShop
              </span>
            </div>

            {/* colita del globo */}
            <div
              className={`absolute -bottom-1 left-5 w-3 h-3 rotate-45 ${t.tail}`}
              style={{ borderBottomLeftRadius: 4 }}
            />
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
