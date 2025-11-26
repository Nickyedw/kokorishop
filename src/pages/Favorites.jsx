import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FavoritesContext } from "../context/FavoritesContext";
import ProductCard from "../components/ProductCard";

const LOGO_BG = `${import.meta.env.BASE_URL}img/logo_kokorishop.png`;

export default function Favorites() {
  const usuario_nombre = localStorage.getItem("usuario_nombre") || "Invitado";
  const usuario_id = localStorage.getItem("usuario_id");
  const isGuest = !usuario_id; // Estrategia: si no hay id, tratamos como invitado

  const navigate = useNavigate();
  const { favorites } = useContext(FavoritesContext);

  return (
    <>
      {/* 🔑 Animación suave para cards (fade + slide up) */}
      <style>{`
        @keyframes fav-card-fade {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden text-white bg-gradient-to-br from-[#1b0b2a] via-[#301448] to-[#12051f]">
        {/* 🎆 Luces Kuromi */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 0 0, rgba(255,122,196,0.28), transparent 55%), radial-gradient(circle at 100% 0, rgba(196,161,255,0.22), transparent 55%), radial-gradient(circle at 50% 100%, rgba(139,92,246,0.25), transparent 55%)",
          }}
        />

        {/* 🐼 Logo flotando en baja opacidad */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
          <img
            src={LOGO_BG}
            alt="Kokorishop logo"
            className="max-w-[420px] w-[70vw]"
            style={{
              animation: "float-logo 26s ease-in-out infinite alternate",
            }}
          />
        </div>

        {/* Capa de contenido */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* NAVBAR */}
          <nav className="sticky top-0 z-40 backdrop-blur-md bg-black/10 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <button
                onClick={() => navigate("/")}
                className="rounded-full bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 text-xs font-medium shadow-lg shadow-pink-500/30 transition"
              >
                ← Tienda
              </button>

              <div className="text-center flex-1">
                <h1 className="text-xl font-extrabold">💜 Favoritos</h1>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15">
                  {usuario_nombre}
                </span>
              </div>

              {/* espacio fantasma para centrar */}
              <div className="w-10" />
            </div>
          </nav>

          {/* 🔔 Banner para invitados (refuerzo al registro) */}
          {isGuest && (
            <div className="bg-black/20 border-b border-white/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
                <p className="text-purple-50">
                  💖{" "}
                  <span className="font-semibold">¡Guarda tus favoritos!</span>{" "}
                  Inicia sesión o crea una cuenta para guardar esta lista en
                  cualquier dispositivo.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate("/register")}
                    className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-pink-500 hover:bg-pink-600 text-white shadow-sm"
                  >
                    Crear cuenta
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-white/40 text-white hover:bg-white/10"
                  >
                    Iniciar sesión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO */}
          <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
            {/* ESTADO VACÍO */}
            {favorites.length === 0 && (
              <div className="min-h-[55vh] flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl px-8 py-9 sm:px-10 sm:py-10 text-center max-w-md w-full border border-white/15 shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-500 flex items-center justify-center shadow-pink-500/40 mb-4">
                    <span className="text-4xl">🛒</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold mb-1">
                    Oh no... ¡Tu lista de deseos está un poco solitaria! 🥺
                  </h2>
                  <p className="mt-2 text-sm text-purple-100/90">
                    Empieza a buscar productos cute que te enamoren. Te
                    ayudamos:
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center">
                    <button
                      onClick={() => navigate("/catalogo")}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-6 py-3 text-sm font-semibold rounded-full shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition-transform"
                    >
                      IR AL CATÁLOGO COMPLETO
                    </button>
                    <button
                      onClick={() => navigate("/catalogo?ofertas=1")}
                      className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors"
                    >
                      VER NUESTRAS OFERTAS ✨
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GRID DE FAVORITOS (usa tu ProductCard completo) */}
            {favorites.length > 0 && (
              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-2
                  md:grid-cols-3
                  lg:grid-cols-4
                  gap-4
                  place-items-center
                "
              >
                {favorites.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex justify-center w-full max-w-[330px]"
                    style={{
                      animation: "fav-card-fade 0.55s ease-out both",
                      animationDelay: `${idx * 70}ms`,
                    }}
                  >
                    <ProductCard producto={p} />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
