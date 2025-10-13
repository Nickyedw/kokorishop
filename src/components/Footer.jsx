// src/components/Footer.jsx
import React from "react";
import { FaInstagram, FaTiktok, FaFacebook, FaWhatsapp } from "react-icons/fa";

const YEAR = new Date().getFullYear();
const env = import.meta.env || {};
const ENV_LINKS = {
  instagram: env.VITE_SOCIAL_INSTAGRAM || "",
  tiktok:    env.VITE_SOCIAL_TIKTOK    || "",
  facebook:  env.VITE_SOCIAL_FACEBOOK  || "",
  whatsapp:  env.VITE_SOCIAL_WHATSAPP  || "",
};

export default function Footer({
  instagramUrl = ENV_LINKS.instagram,
  tiktokUrl    = ENV_LINKS.tiktok,
  facebookUrl  = ENV_LINKS.facebook,
  whatsappUrl  = ENV_LINKS.whatsapp,
  designerName = "EAGE IA Lab",
  designerUrl  = env.VITE_DESIGNER_URL || "",       // opcional
  className    = "",
}) {
  const links = [
    { href: instagramUrl, Icon: FaInstagram, label: "Instagram" },
    { href: tiktokUrl,    Icon: FaTiktok,    label: "TikTok"    },
    { href: facebookUrl,  Icon: FaFacebook,  label: "Facebook"  },
    { href: whatsappUrl,  Icon: FaWhatsapp,  label: "WhatsApp"  },
  ].filter(l => !!l.href);

  return (
    <footer className={`bg-purple-900 text-purple-100 mt-10 pb-16 sm:pb-10 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <div className="border-t border-purple-700/70 mb-4"></div>

        {links.length > 0 && (
          <div className="flex items-center justify-center gap-4 mb-3">
            {links.map((item) => {
              const IconCmp = item.Icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className="p-2 rounded-full bg-purple-800/60 hover:bg-purple-700 text-purple-50
                             ring-1 ring-purple-700/60 hover:ring-fuchsia-400/50 transition"
                >
                  <IconCmp className="text-xl" />
                </a>
              );
            })}
          </div>
        )}

        <div className="text-[12px] sm:text-sm text-purple-300 mb-2">
          🔒 Pagos seguros con <span className="font-semibold text-purple-100">Plin</span> ·{" "}
          <span className="font-semibold text-purple-100">Yape</span> ·{" "}
          <span className="font-semibold text-purple-100">Transferencia</span>
        </div>

        <p className="text-xs sm:text-sm text-purple-300">
          © {YEAR} <span className="text-pink-300 font-bold">Kokorishop</span> · Todos los derechos reservados
          {" "}{designerUrl ? (
            <>
              · Diseñado por{" "}
              <a
                href={designerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-pink-300/60 hover:text-pink-300"
              >
                {designerName}
              </a>
            </>
          ) : (
            <>· Diseñado por {designerName}</>
          )}
        </p>
      </div>
    </footer>
  );
}
