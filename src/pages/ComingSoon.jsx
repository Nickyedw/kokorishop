// src/pages/ComingSoon.jsx
import React from "react";

// Ruta local del logo en /public/img/
const DEFAULT_LOGO_SRC = "/img/logo_kokorishop.png";

export default function ComingSoon() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white px-6 overflow-hidden bg-gradient-to-b from-[#4A148C] via-[#311B92] to-black">

      {/* Fondo navideño suave */}
      <div className="absolute inset-0 bg-[url('https://i.imgur.com/8H0rG9t.jpg')] bg-cover bg-center opacity-20"></div>

      {/* Capa violeta degradada */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/70 via-purple-950/80 to-black/90"></div>

      {/* ❄️ NIEVE (Snowfall Overlay) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="snow"></div>
      </div>

      {/* LOGO */}
      <img
        src={DEFAULT_LOGO_SRC}
        alt="Kokorishop Logo"
        className="w-48 md:w-60 h-auto mb-6 drop-shadow-2xl animate-floating"
      />

      {/* TÍTULO */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center text-fuchsia-200 drop-shadow-lg">
        🎄 Muy pronto 🎁
      </h1>

      {/* DESCRIPCIÓN */}
      <p className="mt-4 max-w-md text-center text-white/80 leading-relaxed">
        La magia navideña llega a{" "}
        <span className="font-semibold text-fuchsia-300">Kokorishop</span>.  
        Estamos preparando una nueva tienda llena de productos kawaii, regalos,
        accesorios, tecnología y detalles perfectos para esta temporada. 🎅✨
      </p>

      <p className="mt-6 text-xs md:text-sm text-center text-white/60">
        ✨ Fotos reales, catálogo renovado y una experiencia más kawaii que nunca ✨  
      </p>

      <p className="mt-4 text-xs text-white/40 italic text-center">
        Vuelve pronto… Santa Kokori está preparando sorpresas 🎀💜
      </p>

      {/* 🎨 ESTILOS INTERNOS */}
      <style>{`
        /* ❄️ Animación de nieve */
        .snow {
          position: absolute;
          top: -10%;
          left: 0;
          width: 100%;
          height: 120%;
          background-image: url('https://i.imgur.com/FXjVYIH.png');
          background-size: contain;
          animation: snowfall 12s linear infinite;
          opacity: 0.7;
        }

        @keyframes snowfall {
          0% { transform: translateY(-10%); }
          100% { transform: translateY(100%); }
        }

        /* ✨ Logo flotando suavemente */
        .animate-floating {
          animation: floating 4s ease-in-out infinite;
        }

        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
