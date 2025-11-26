// src/components/Footer.jsx
import React from "react";
import { FaInstagram, FaTiktok, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { Mail, Phone, MapPin, Heart } from "lucide-react";

// Ajusta la ruta si tu logo está en otra carpeta
const DEFAULT_LOGO_SRC = `${import.meta.env.BASE_URL}img/logo_kokorishop.png`;

const YEAR = new Date().getFullYear();
const env = import.meta.env || {};

const ENV_LINKS = {
  instagram: env.VITE_SOCIAL_INSTAGRAM || "",
  tiktok: env.VITE_SOCIAL_TIKTOK || "",
  facebook: env.VITE_SOCIAL_FACEBOOK || "",
  whatsapp: env.VITE_SOCIAL_WHATSAPP || "",
};

export default function Footer({
  instagramUrl = ENV_LINKS.instagram,
  tiktokUrl = ENV_LINKS.tiktok,
  facebookUrl = ENV_LINKS.facebook,
  whatsappUrl = ENV_LINKS.whatsapp,
  designerName = "EAGE IA Lab",
  designerUrl = env.VITE_DESIGNER_URL || "",
  logoSrc = DEFAULT_LOGO_SRC,
  className = "",
}) {
  const socialLinks = [
    { href: instagramUrl, icon: FaInstagram, label: "Instagram" },
    { href: tiktokUrl, icon: FaTiktok, label: "TikTok" },
    { href: facebookUrl, icon: FaFacebook, label: "Facebook" },
    { href: whatsappUrl, icon: FaWhatsapp, label: "WhatsApp" },
  ].filter((l) => !!l.href);

  return (
    <footer
      className={`bg-gradient-to-br from-black via-purple-950 to-fuchsia-950 text-white border-t-2 border-fuchsia-500/20 
        ${className}
      `}
    >
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 py-12">

        {/* === GRID PRINCIPAL === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Columna 1: Logo + descripción + redes */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img
                src={logoSrc}
                alt="Kokorishop"
                className="h-16 w-auto object-contain"
              />
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Tu tienda favorita de productos kawaii.  
              Hacemos que cada día sea más cute y especial. ✨
            </p>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon; // 👈 aquí renombramos, sin problema con ESLint
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      title={link.label}
                      className="
                        bg-fuchsia-500/10 hover:bg-fuchsia-500/20
                        border border-fuchsia-500/30
                        p-2 rounded-full
                        transition-all hover:scale-110
                      "
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna 2 */}
          <div>
            <h3 className="mb-4 text-fuchsia-400">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-fuchsia-400">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Catálogo Completo</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Ofertas Especiales</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Blog Kawaii</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Programa de Lealtad</a></li>
            </ul>
          </div>

          {/* Columna 3 */}
          <div>
            <h3 className="mb-4 text-fuchsia-400">Servicio al Cliente</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-fuchsia-400">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Seguimiento de Pedido</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Envíos y Entregas</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Devoluciones</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-fuchsia-400">Política de Privacidad</a></li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="mb-4 text-pink-300">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-pink-400 mt-0.5" />
                <span className="text-pink-200">Lima, Perú</span>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-pink-400" />
                <a href="tel:+51977546073" className="text-pink-200 hover:text-white">
                  +51 977546073
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-pink-400" />
                <a href="mailto:hola@kokorishop.com" className="text-pink-200 hover:text-white">
                  hola@kokorishop.com
                </a>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-fuchsia-500/10 rounded-lg backdrop-blur-sm border border-fuchsia-500/20">
              <p className="text-sm text-fuchsia-300 mb-1">Horario de Atención</p>
              <p className="text-xs text-gray-400">Lun - Vie: 9:00 AM - 6:00 PM</p>
              <p className="text-xs text-gray-400">Sáb: 10:00 AM - 2:00 PM</p>
            </div>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="border-t border-fuchsia-500/20 pt-8 mb-8">
          <p className="text-center text-sm text-fuchsia-300 mb-4">
            Pagos seguros con{" "}
            <span className="text-white font-semibold">Plin</span> ·{" "}
            <span className="text-white font-semibold">Yape</span> ·{" "}
            <span className="text-white font-semibold">Transferencia</span>
          </p>

          <div className="flex justify-center flex-wrap gap-4">
            {["Visa", "Mastercard", "PayPal", "Yape", "Plin"].map((method) => (
              <div
                key={method}
                className="bg-fuchsia-500/10 backdrop-blur-sm border border-fuchsia-500/20 px-4 py-2 rounded-lg text-gray-300 text-sm"
              >
                {method}
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-fuchsia-500/20 pt-8 text-center">
          <p className="text-sm text-gray-400 flex items-center justify-center gap-2 flex-wrap">
            © {YEAR} Kokorishop. Todos los derechos reservados.
            <span className="flex items-center gap-1">
              Hecho con{" "}
              <Heart className="h-4 w-4 fill-fuchsia-400 text-fuchsia-400" />{" "}
              en Perú · Diseñado por{" "}
              {designerUrl ? (
                <a
                  href={designerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-pink-300/60 hover:text-pink-300"
                >
                  {designerName}
                </a>
              ) : (
                <span>{designerName}</span>
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Gradiente de texto tipo Kuromi (por si lo usas en el futuro) */}
      <style>{`
        .kuromi-text {
          background: linear-gradient(90deg, #FF1493, #FF69B4, #BA55D3, #9370DB);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: bold;
        }
      `}</style>
    </footer>
  );
}
