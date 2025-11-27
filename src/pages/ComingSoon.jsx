// src/pages/ComingSoon.jsx
import React from "react";
import logo from "../assets/logo_kokorishop.png"; // ajusta la ruta si tu logo está en otra carpeta

export default function ComingSoon() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #240046, #3c096c)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
        color: "#fff",
      }}
    >
      <img
        src={logo}
        alt="Logo Kokorishop"
        style={{ width: "180px", marginBottom: "20px" }}
      />

      <h1 style={{ fontSize: "34px", marginBottom: "10px" }}>
        💜 Muy pronto 💜
      </h1>

      <p style={{ fontSize: "18px", maxWidth: "420px" }}>
        Estamos preparando algo súper kawaii para ti.  
        Vuelve muy pronto y descubre nuestras novedades ✨🐼💖
      </p>
    </div>
  );
}
