// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from 'react';
import { FaHeart, FaShoppingBag, FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import MiniCart from '../components/MiniCart';
import MobileMenu from '../components/MobileMenu';
import SloganRibbon from "../components/SloganRibbon";

// Nombre de la tienda (se muestra en el header)
const STORE_NAME = 'Kokorishop';

const base = import.meta.env.BASE_URL; // "/" en dev, "/kokorishop/" en prod si usas subcarpeta
const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_APP}/api`;

/** HERO VIDEO – limpio, centrado y sin overlay */
function HeroVideo() {
  const PUB = import.meta.env.BASE_URL || "/";

  return (
    <section className="relative w-full mt-4">
      {/* contenedor centrado y ancho máximo en desktop */}
      <div className="mx-auto w-[94%] max-w-5xl rounded-3xl overflow-hidden bg-purple-900">
        {/* alto por breakpoint (mobile/tablet) y proporción en desktop */}
        <div className="relative h-48 sm:h-64 md:h-80 lg:h-auto lg:aspect-[16/9]">
          <video
            className="absolute inset-0 w-full h-full object-cover lg:object-contain bg-black"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={`${PUB}img/kokorishop-hero-poster.jpg`}
          >
            <source src={`${PUB}media/kokorishop-hero.webm`} type="video/webm" />
            <source src={`${PUB}media/kokorishop-hero.mp4`} type="video/mp4" />
          </video>

          {/* layout interno: cinta arriba, CTA abajo */}
          <div className="absolute inset-0 z-10 flex flex-col">
            <div className="pt-3 px-3 self-center">
              <SloganRibbon variant="ribbon" text="Donde todo es Cute" />
            </div>
            <div className="flex-1" />
            <div className="pb-0 sm:pb-4 self-center">
              <Link
                to="/catalogo"
                className="relative inline-block rounded-full
                           bg-gradient-to-r from-pink-500/90 to-fuchsia-500/90
                           hover:from-pink-600/95 hover:to-fuchsia-600/95
                           text-white font-semibold
                           px-4 sm:px-5
                           py-0.5 sm:py-1 md:py-1.5
                           text-xs sm:text-sm md:text-base
                           border border-white/70
                           shadow-md backdrop-blur-sm transition overflow-hidden"
              >
                Ver catálogo
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    border: "2px solid transparent",
                    background:
                      "linear-gradient(90deg, #ff4d8d, #ffde59, #66ffcc, #a66bff, #ff4d8d)",
                    backgroundSize: "400% 400%",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "destination-out",
                    maskComposite: "exclude",
                    animation: "glowRainbow 4s linear infinite",
                  }}
                />
              </Link>
              <style>{`
                @keyframes glowRainbow {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Home = () => {
  const usuario_nombre = localStorage.getItem('usuario_nombre') || 'Invitado';
  const { cartItems } = useContext(CartContext);
  const { favorites } = useContext(FavoritesContext);

  const [destacados, setDestacados] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [oferta, setOferta] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const totalItems = (cartItems || []).reduce((sum, item) => sum + (item?.quantity || 0), 0);

  // helpers rol admin
  const readBool = (k) => {
    const v = (localStorage.getItem(k) || '').toString().trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  };
  const readRoleIsAdmin = (...keys) =>
    keys.some((k) => (localStorage.getItem(k) || '').toString().trim().toLowerCase() === 'admin');

  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('admin') === '1') localStorage.setItem('is_admin', 'true');
  } catch {/* noop */}

  const isAdmin =
    readRoleIsAdmin('usuario_rol', 'rol', 'role') ||
    readBool('usuario_is_admin') ||
    readBool('is_admin') ||
    readBool('es_admin') ||
    readBool('admin') ||
    readBool('isAdmin');

  useEffect(() => {
    const cargarSecciones = async () => {
      try {
        const bust = `?bust=${Date.now()}`;
        const [resDestacados, resMasVendidos, resOferta] = await Promise.all([
          fetch(`${API_BASE}/productos/destacados${bust}`, { cache: 'no-store' }),
          fetch(`${API_BASE}/productos/mas-vendidos${bust}`, { cache: 'no-store' }),
          fetch(`${API_BASE}/productos/oferta${bust}`, { cache: 'no-store' }),
        ]);

        const [dataDestacados, dataMasVendidos, dataOferta] = await Promise.all([
          resDestacados.json(),
          resMasVendidos.json(),
          resOferta.json(),
        ]);

        setDestacados(Array.isArray(dataDestacados) ? dataDestacados : []);
        setMasVendidos(Array.isArray(dataMasVendidos) ? dataMasVendidos : []);
        setOferta(Array.isArray(dataOferta) ? dataOferta : []);
      } catch (err) {
        console.error('Error al cargar secciones del home:', err);
      }
    };
    cargarSecciones();
  }, []);

  // Si hay footer admin, reservamos espacio
  const pagePaddingBottom = isAdmin ? 'pb-[88px]' : 'pb-6';

  return (
    <div className={`min-h-screen bg-purple-900 text-white ${pagePaddingBottom}`}>
      {/* Navbar */}
      <nav className="grid grid-cols-[auto,1fr,auto] items-center gap-4 px-4 sm:px-6 py-3 bg-purple-800/95 shadow-lg">
        {/* Icono pequeño de la tienda */}
        <img
          src={`${base}img/logo_ks.png`}
          alt="Icono tienda KokoriShop"
          className="h-14 sm:h-20 md:h-24 w-auto object-contain shrink-0 drop-shadow-[0_0_4px_rgba(255,255,255,.6)]"
          loading="eager"
          decoding="async"
          onError={(e) => (e.currentTarget.src = `${base}img/no-image.png`)}
        />

        {/* Logo central */}
        <div className="flex justify-center">
          <img
            src={`${base}img/logo_kokorishop.png`}
            alt="KokoriShop"
            className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 w-[min(85vw,820px)] object-contain mx-auto drop-shadow-[0_0_6px_rgba(255,255,255,.55)]"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-4 relative text-lg">
          <Link to="/favorites" className="relative" aria-label="Favoritos">
            <FaHeart />
            {favorites.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 grid place-items-center rounded-full">
                {favorites.length}
              </span>
            )}
          </Link>

          <Link to="/Cart" className="relative" aria-label="Carrito">
            <FaShoppingBag />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs w-5 h-5 grid place-items-center rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="text-white/90 md:hidden"
            aria-label="Menú"
            onClick={() => setMenuOpen(true)}
          >
            <FaBars />
          </button>
          <button
            type="button"
            className="text-white/90 hidden md:block"
            aria-label="Menú escritorio"
            onClick={() => setMenuOpen(true)}
          >
            <FaBars />
          </button>
        </div>
      </nav>

      {/* Barra secundaria (saludo) */}
      <div className="bg-gradient-to-r from-purple-700 to-fuchsia-700 text-purple-50 py-2 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
          <p className="text-xs sm:text-sm md:text-base">
            👋 Bienvenido, <span className="font-semibold">{usuario_nombre}</span>
          </p>
          {isAdmin && (
            <span
              title="Modo admin activo"
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-red-500/90 text-white px-2.5 py-0.5 rounded-full border border-red-300 shadow-sm"
            >
              ADMIN
            </span>
          )}
        </div>
      </div>

      {/* Hero (solo video) */}
      <HeroVideo />

      {/* ⭐ Productos Destacados */}
      {destacados.length > 0 && (
        <section className="px-6 mt-8">
          <h2 className="flex items-center gap-2 mb-4 text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-300 drop-shadow-[0_1px_0_rgba(0,0,0,.25)]">
            <span className="text-lg sm:text-xl lg:text-2xl" aria-hidden>⭐</span>
            Productos Destacados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {destacados.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddedToCart={() => window.dispatchEvent(new CustomEvent('minicart:open'))}
              />
            ))}
          </div>
        </section>
      )}

      {/* 🔥 Más Vendidos */}
      {masVendidos.length > 0 && (
        <section className="px-6 mt-10">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-orange-300 mb-4">🔥 Más Vendidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {masVendidos.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddedToCart={() => window.dispatchEvent(new CustomEvent('minicart:open'))}
              />
            ))}
          </div>
        </section>
      )}

      {/* 💥 Productos en Oferta */}
      {oferta.length > 0 && (
        <section className="px-6 mt-10">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-red-300 mb-4">💥 Productos en Oferta</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {oferta.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddedToCart={() => window.dispatchEvent(new CustomEvent('minicart:open'))}
              />
            ))}
          </div>
        </section>
      )}

      {/* Ver catálogo completo */}
      <div className="text-center my-10">
        <Link
          to="/catalogo"
          className="koko-big-cta inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold"
        >
          <span>📦</span> Ir al Catálogo Completo
        </Link>
      </div>

      {/* Footer admin */}
      {isAdmin && (
        <footer className="fixed bottom-0 left-0 right-0 bg-purple-800 text-purple-200 shadow-inner flex justify-around py-3 rounded-t-3xl">
          <Link to="/" className="flex flex-col items-center text-sm">
            <FaShoppingBag className="text-xl" />
            Home
          </Link>
          <Link to="/favorites" className="flex flex-col items-center text-sm">
            <FaHeart className="text-xl" />
            Favorites
          </Link>
          <Link to="/Cart" className="flex flex-col items-center text-sm">
            <FaShoppingBag className="text-xl" />
            Cart
          </Link>
          <Link to="/admin" className="flex flex-col items-center text-sm">
            <FaBars className="text-xl" />
            Menu
          </Link>
        </footer>
      )}

      <MiniCart cartPath="/Cart" checkoutMode="query" />
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        usuarioNombre={usuario_nombre}
        favCount={favorites.length}
        cartCount={totalItems}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Home;
