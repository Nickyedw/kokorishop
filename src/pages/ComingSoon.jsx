// src/pages/ComingSoon.jsx
import React from "react";

const DEFAULT_LOGO_SRC = "/img/logo_kokorishop.png";

export default function ComingSoon() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden
      bg-gradient-to-b from-purple-900 via-purple-950 to-black px-4">
      
      {/* ❄️ Capa de nieve solo CSS */}
      <div className="snow" />

      {/* Contenido por encima de la nieve */}
      <img
        src={DEFAULT_LOGO_SRC}
        alt="Kokorishop Logo"
        className="w-40 h-auto mb-6 drop-shadow-lg z-10"
      />

      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center z-10">
        🎄 Muy pronto 🎁
      </h1>

      <p className="mt-4 text-center text-lg opacity-90 max-w-md z-10">
        Tecnología, detalles perfectos y un catálogo renovado para esta temporada ✨
      </p>
    </div>
  );
}
