// src/pages/ComingSoon.jsx
import React from "react";
import "./snow.css"; // 👈 Importamos la animación de nieve CSS

const DEFAULT_LOGO_SRC = "/img/logo_kokorishop.png"; // Ruta válida en Vercel

export default function ComingSoon() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-purple-950 to-black text-white px-6 overflow-hidden">

      {/* ❄️ Capa de nieve */}
      <div className="snow"></div>

      {/* 🎀 Logo flotando */}
      <img
        src={DEFAULT_LOGO_SRC}
        alt="Kokorishop Logo"
        className="w-52 md:w-64 h-auto mb-8 drop-shadow-xl animate-floating"
      />

      {/* 🎄 Mensaje principal navideño */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center flex items-center gap-3">
        🎄 Muy pronto 🎁
      </h1>

      {/* ✨ Texto navideño kawaii */}
      <p className="mt-4 max-w-md text-sm md:text-base text-center text-white/80 leading-relaxed">
        La magia navideña llega a{" "}
        <span className="font-semibold text-fuchsia-300">Kokorishop</span>.  
        Estamos preparando una nueva tienda llena de productos kawaii,  
        regalos, accesorios, tecnología y detalles perfectos para esta temporada.  
      </p>

      <p className="mt-4 max-w-md text-xs md:text-sm text-center text-fuchsia-200">
        ✨ Fotos reales, catálogo renovado y una experiencia más kawaii que nunca ✨
      </p>

      <p className="mt-8 text-xs md:text-sm text-purple-200/80 text-center">
        Vuelve pronto… Santa Kokori está preparando sorpresas 🎅💜
      </p>
    </div>
  );
}
