// src/pages/ComingSoon.jsx
import React from "react";

const DEFAULT_LOGO_SRC = "/img/logo_kokorishop.png";

export default function ComingSoon() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden
      bg-gradient-to-b from-purple-900 via-purple-950 to-black px-4">
      
      {/* ❄️ Capa de nieve solo CSS */}
      <div className="snow" />

      {/* LOGO + HALO + DESTELLOS */}
      <div className="relative z-30 flex flex-col items-center justify-center mb-4">
        
        {/* 🌈 Halo multicolor Kuromi */}
        <div className="halo-kokori" />

        {/* ✨ Destellos animados */}
        <div className="sparkles sparkles-1" />
        <div className="sparkles sparkles-2" />

        {/* LOGO flotando */}
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
        Tu tienda online con productos Kawaii, regalos, Tecnología, detalles perfectos y un catálogo renovado para esta temporada ¡Donde todo es Cute! ✨
      </p>
    </div>
  );
}
