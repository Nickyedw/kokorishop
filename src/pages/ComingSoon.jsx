// src/pages/ComingSoon.jsx
import React from "react";

const DEFAULT_LOGO_SRC = "/img/logo_kokorishop.png"; // <- Ruta válida en Vercel

function ComingSoon() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-purple-950 to-black text-white px-4">
      
      {/* Logo */}
      <img
        src={DEFAULT_LOGO_SRC}
        alt="Kokorishop Logo"
        className="w-40 h-auto mb-6 drop-shadow-lg"
      />

      {/* Mensaje principal */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center">
        💜 Muy pronto
      </h1>

      <p className="mt-4 max-w-md text-sm md:text-base text-center text-white/70">
        Estamos preparando la nueva versión de{" "}
        <span className="font-semibold text-fuchsia-300">Kokorishop</span>,
        con productos reales, fotos actualizadas y una experiencia aún más kawaii.
      </p>

      <p className="mt-6 text-xs md:text-sm text-white/60 text-center">
        Síguenos y vuelve en unos días ✨
      </p>
    </div>
  );
}

export default ComingSoon;
