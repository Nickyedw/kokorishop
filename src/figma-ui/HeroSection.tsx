import { Button } from "./ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Misma lógica que usas en Home.jsx para rutas en producción (GitHub Pages, etc.)
  const PUB = (import.meta as any).env.BASE_URL || "/";

  return (
    <section className="relative bg-gradient-to-br from-purple-900 via-black to-fuchsia-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-fuchsia-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-pink-500 rounded-full opacity-20 animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-600 rounded-full opacity-20 animate-pulse delay-150"></div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-white text-center md:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-fuchsia-500/30">
              <Sparkles className="h-4 w-4 text-fuchsia-400" />
              <span className="text-sm">Nuevos productos cada semana</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl">
              Donde Todo es{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">
                Cute
              </span>{" "}
              ✨
            </h2>

            <p className="text-lg md:text-xl text-gray-300 max-w-lg">
              Descubre el mundo kawaii con nuestra exclusiva colección de
              productos adorables. ¡Desde peluches hasta accesorios que harán tu
              día más feliz! 💀💕
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {/* 👉 Botón principal enlazado a /catalogo */}
              <Button
                asChild
                size="lg"
                className="
                  bg-gradient-to-r from-fuchsia-600 to-pink-500
                  hover:from-fuchsia-700 hover:to-pink-600
                  text-white shadow-xl hover:shadow-2xl
                  transform hover:scale-105 transition-all duration-300
                  group rounded-full px-8 py-6 text-lg border-2 border-white/20
                "
              >
                <Link to="/catalogo">
                  Ver Catálogo Completo
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              {/* 🔥 Botón de ofertas → /catalogo?ofertas=1 */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="
                  bg-white/10 backdrop-blur-sm
                  border-2 border-fuchsia-500
                  text-white hover:bg-fuchsia-500 hover:text-white
                  shadow-lg rounded-full px-8 py-6 text-lg
                  transition-all duration-300
                "
              >
                <Link to="/catalogo?ofertas=1">
                  Ver Ofertas 🔥
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 justify-center md:justify-start pt-4">
              <div className="text-center md:text-left">
                <p className="text-2xl text-fuchsia-400">500+</p>
                <p className="text-sm text-gray-400">Productos</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-2xl text-fuchsia-400">10k+</p>
                <p className="text-sm text-gray-400">Clientes Felices</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-2xl text-fuchsia-400">⭐ 4.9</p>
                <p className="text-sm text-gray-400">Valoración</p>
              </div>
            </div>
          </div>

          {/* Hero Video */}
          <div className="relative">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

              <div className="relative bg-black/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-fuchsia-500/30">
                <div className="relative w-full aspect-video bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 overflow-hidden">
                  {/* ✅ VIDEO REAL DE KOKORISHOP */}
                  <video
                    ref={videoRef}
                    className="block w-full h-full object-cover absolute inset-0"
                    loop
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                    poster={`${PUB}img/kokorishop-hero-poster.jpg`}
                  >
                    <source
                      src={`${PUB}media/kokorishop-hero.webm`}
                      type="video/webm"
                    />
                    <source
                      src={`${PUB}media/kokorishop-hero.mp4`}
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white px-6 py-3 rounded-full shadow-xl border-4 border-black animate-bounce">
                <p className="text-sm">🎉 ¡Envío Gratis!</p>
              </div>

              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white px-6 py-3 rounded-full shadow-xl border-4 border-black animate-pulse">
                <p className="text-sm">💝 -25% OFF</p>
              </div>
            </div>

            {/* Video Info Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-fuchsia-500/30 flex items-center gap-2">
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm">Video HD</span>
              </div>
              <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-fuchsia-500/30">
                <span className="text-white text-sm">
                  ✨ Nuestros Productos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="#0a0a0a"
          />
        </svg>
      </div>
    </section>
  );
}
