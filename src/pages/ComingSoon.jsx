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
            <div className="relative z-10 flex items-center justify-center">
            {/* 🌟 Halo de luz detrás del logo */}
            <div className="absolute w-60 h-60 md:w-72 md:h-72 bg-purple-500/40 blur-3xl rounded-full animate-glow"></div>

            {/* 🌫️ Sombra violeta difusa debajo */}
            <div className="absolute bottom-[-20px] w-40 h-10 md:w-52 md:h-12 bg-purple-800/40 blur-2xl rounded-full"></div>

            {/* LOGO */}
            <img
                src={DEFAULT_LOGO_SRC}
                alt="Kokorishop Logo"
                className="relative w-48 md:w-60 h-auto drop-shadow-2xl animate-float"
            />
            </div>



      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center z-10">
        🎄 Muy pronto 🎁
      </h1>

      <p className="mt-4 text-center text-lg opacity-90 max-w-md z-10">
        Tecnología, detalles perfectos y un catálogo renovado para esta temporada ✨
      </p>
    </div>
  );
}
