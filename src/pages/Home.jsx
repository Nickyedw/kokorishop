// src/pages/Home.jsx
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { FaHeart, FaShoppingBag, FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
void motion;

import ProductCard from '../components/ProductCard';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import MiniCart from '../components/MiniCart';
import MobileMenu from '../components/MobileMenu';
import KokoriIntro from '../components/KokoriIntro';
import SloganRibbon from "../components/SloganRibbon";


// Nombre de la tienda (se muestra en el header)
const STORE_NAME = 'Kokorishop';

const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_APP}/api`;

// Fallback inline (sin 404 de red)
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
       <rect width="100%" height="100%" fill="#f3f4f6"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="Arial" font-size="14" fill="#9ca3af">Sin imagen</text>
     </svg>`
  );

/** Normaliza cualquier “cosa de imagen” a una URL usable */
function toFullUrl(raw) {
  if (!raw) return FALLBACK_IMG;

  let s = typeof raw === 'string' ? raw : raw?.url ?? raw?.src ?? '';
  if (!s) return FALLBACK_IMG;

  s = s.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(s)) return s;

  const upIdx = s.toLowerCase().indexOf('/uploads/');
  if (upIdx >= 0) return `${API_APP}${s.slice(upIdx)}`;
  if (s.startsWith('/')) return `${API_APP}${s}`;
  return `${API_APP}/uploads/${s}`;
}

/** Carrusel kawaii con overlay y CTA clickeable siempre */
function MiniCarousel({ images = [] }) {
  const [idx, setIdx] = useState(0);
  const len = images.length;

  React.useEffect(() => {
    if (idx >= len) setIdx(Math.max(0, len - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [len]);

  const prev = () => setIdx((i) => (i - 1 + len) % len);
  const next = () => setIdx((i) => (i + 1) % len);

 /** Campo de “ambientales” (corazones+estrellas) responsive */
function AmbientField() {
  // posiciones (en %) válidas para cualquier tamaño
  const points = [
    ['top-[10%] left-[12%]', 0.00],
    ['top-[18%] right-[10%]', 0.20],
    ['bottom-[20%] left-[16%]', 0.50],
    ['bottom-[22%] right-[14%]', 0.80],
    ['top-[30%] left-[45%]', 1.00],
    ['top-[26%] left-[28%]', 1.20],
    ['top-[34%] right-[28%]', 1.40],
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {points.map(([pos, d], i) => (
        <React.Fragment key={i}>
          {/* Heart + glow */}
          <span className={`absolute ${pos}`}>
            {/* glow (ping) – escala responsive */}
            <span
              className="absolute -inset-1 rounded-full bg-pink-400/15 blur-[2px]
                         animate-ping
                         scale-75 sm:scale-90 md:scale-100 lg:scale-110"
              style={{ animationDelay: `${d}s` }}
            />
            {/* corazón – tamaño responsive */}
            <span
              className="relative inline-block
                         text-[14px] sm:text-[16px] md:text-[20px] lg:text-[22px]"
              style={{
                animation: `beatFade 1.9s ${d}s infinite cubic-bezier(.4,0,.2,1)`
              }}
              aria-hidden
            >
              💖
            </span>
          </span>

          {/* star – tamaño y ligero offset responsive */}
          <span
            className={`absolute ${pos} text-yellow-300
                        translate-y-[22px] sm:translate-y-[24px] md:translate-y-[26px]`}
            style={{
              animation: `twinkle 1.6s ${d + 0.3}s infinite ease-in-out`,
              fontSize: 'clamp(12px, 2.5vw, 20px)'
            }}
            aria-hidden
          >
            ✨
          </span>
        </React.Fragment>
      ))}

      {/* keyframes locales (ya usados arriba) */}
      <style>{`
        @keyframes beatFade {
          0%   { transform: scale(.7) translateY(0);   opacity:.9 }
          45%  { transform: scale(1.2) translateY(-8px); opacity:.7 }
          100% { transform: scale(1.6) translateY(-16px); opacity:0 }
        }
        @keyframes twinkle {
          0%   { opacity:.6; transform: translateY(28px) scale(.9) rotate(-8deg) }
          50%  { opacity:1;  transform: translateY(22px) scale(1.1) rotate(6deg) }
          100% { opacity:.7; transform: translateY(28px) scale(1.05) rotate(-4deg) }
        }
      `}</style>
    </div>
  );
}

 {/* HERO SIN IMÁGENES */}
if (!len) {
  return (
    <section className="relative mx-4 mt-4 rounded-3xl overflow-hidden bg-gradient-to-r from-purple-800 via-fuchsia-700 to-pink-600">
      <div className="h-56 md:h-72 lg:h-96 relative">
        <AmbientField />

        {/* CINTA SUPERIOR (SIEMPRE ARRIBA) */}
        <SloganRibbon variant="ribbon" text="Donde todo es Cute" />
        {/* o banner completo en campañas: */}
        {/* <SloganRibbon variant="banner" text="Donde todo es Cute" /> */}

        {/* Intro centrado */}
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <KokoriIntro
            sizeByBp={{ sm:110, md:140, lg:175, xl:175 }}
            panda={{ sm:{gap:-25,y:-6,scale:.95}, md:{gap:40,y:-10,scale:1}, lg:{gap:20,y:-15,scale:1.2}, xl:{gap:20,y:-15,scale:1.22} }}
            monkey={{ sm:{gap:70,y:-30,scale:.95}, md:{gap:120,y:-14,scale:1}, lg:{gap:170,y:-58,scale:1.2}, xl:{gap:120,y:-58,scale:1.22} }}
            titleY={{ sm:-2, md:-3, lg:-4, xl:-4 }}
          />
        </div>

        {/* CTA */}
        <div className="absolute z-30 left-1/2 bottom-6 -translate-x-1/2 pointer-events-auto">
          <Link to="/catalogo" className="koko-cta bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-lg">
            Ver catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}

{/* HERO CON IMÁGENES */}
return (
  <section className="relative mx-4 mt-4 rounded-3xl overflow-hidden">
    {/* Fondo */}
    <div className="relative">
      <img
        src={toFullUrl(images[idx])}
        alt={`banner-${idx + 1}`}
        className="w-full h-56 md:h-72 lg:h-96 object-cover"
        onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-purple-900/25 to-transparent z-0 pointer-events-none" />
    </div>

    {/* Ambientales + Intro */}
    <AmbientField />
      {/* CINTA SUPERIOR */}
      <SloganRibbon variant="ribbon" text="Donde todo es Cute" />
      {/* versión clickeable hacia catálogo: */}
      {/* <SloganRibbon variant="ribbon" text="Donde todo es Cute" to="/catalogo" /> */}

      {/* Intro centrado */}
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <KokoriIntro
          sizeByBp={{ sm:110, md:140, lg:175, xl:175 }}
          panda={{ sm:{gap:-25,y:-6,scale:.95}, md:{gap:40,y:-10,scale:1}, lg:{gap:20,y:-15,scale:1.2}, xl:{gap:20,y:-15,scale:1.22} }}
          monkey={{ sm:{gap:71,y:-30,scale:.95}, md:{gap:120,y:-14,scale:1}, lg:{gap:170,y:-58,scale:1.2}, xl:{gap:120,y:-58,scale:1.22} }}
          titleY={{ sm:-2, md:-3, lg:-4, xl:-4 }}
        />
      </div>

    {/* CTA */}
      <div className="absolute z-30 left-1/2 bottom-4 sm:bottom-6 -translate-x-1/2 pointer-events-auto">
        <Link
          to="/catalogo"
          className="bg-pink-500 hover:bg-pink-600 text-white 
                    text-sm sm:text-base 
                    px-4 sm:px-6 
                    py-2 sm:py-3 
                    rounded-full font-semibold shadow-lg"
        >
          Ver catálogo
        </Link>
      </div>

      {/* Prev/Next */}
      <div className="absolute inset-0 flex items-center justify-between p-3 z-30 pointer-events-none">
        <button
          type="button"
          aria-label="Anterior"
          onClick={prev}
          className="pointer-events-auto bg-white/2 hover:bg-white text-purple-800 w-9 h-9 rounded-full backdrop-blur shadow"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          onClick={next}
          className="pointer-events-auto bg-white/2 hover:bg-white text-purple-800 w-9 h-9 rounded-full backdrop-blur shadow"
        >
          →
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-30">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir a slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`w-2.5 h-2.5 rounded-full ring-1 ring-white/70 transition
              ${i === idx ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
          />
        ))}
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
  } catch { /* noop */ }

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

  // Imágenes del hero (toma hasta 3 principales de destacados)
  const heroImages = useMemo(() => {
    const imgs = [];
    for (const p of destacados) {
      const principal = p?.imagenes?.[0]?.url || p?.imagen_url;
      if (principal) imgs.push(principal);
      if (imgs.length >= 3) break;
    }
    return imgs;
  }, [destacados]);

  // Si hay footer admin, reservamos espacio
  const pagePaddingBottom = isAdmin ? 'pb-[88px]' : 'pb-6';

  return (
    <div className={`min-h-screen bg-purple-900 text-white ${pagePaddingBottom}`}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-purple-800 shadow-md">
        <span className="text-3xl" aria-hidden>🐾</span>
        <h1 className="text-2xl font-bold">{STORE_NAME}</h1>
        <div className="flex items-center gap-4 relative text-lg">
          <Link to="/favorites" className="relative" aria-label="Favoritos">
            <FaHeart />
            {favorites.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {favorites.length}
              </span>
            )}
          </Link>
          <Link to="/Cart" className="relative" aria-label="Carrito">
            <FaShoppingBag />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs w-5 h-5 flex items-center justify-center rounded-full">
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
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold
                        bg-red-500/90 text-white px-2.5 py-0.5 rounded-full
                        border border-red-300 shadow-sm"
            >
              ADMIN
            </span>
          )}
        </div>
      </div>

      {/* Hero */}
      <MiniCarousel images={heroImages} />

      {/* ⭐ Productos Destacados */}
      {destacados.length > 0 && (
        <section className="px-6 mt-8">
        <h2
          className="flex items-center gap-2 mb-4
                    text-xl sm:text-2xl lg:text-3xl font-bold
                    text-yellow-300 drop-shadow-[0_1px_0_rgba(0,0,0,.25)]"
        >
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
