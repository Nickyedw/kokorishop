// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from 'react';
import { FaHeart, FaShoppingBag, FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import MiniCart from '../components/MiniCart';

const Home = () => {
  const usuario_nombre = localStorage.getItem('usuario_nombre') || 'Invitado';
  const { cartItems } = useContext(CartContext);
  const { favorites } = useContext(FavoritesContext);

  const [destacados, setDestacados] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [oferta, setOferta] = useState([]);

  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  useEffect(() => {
    const cargarSecciones = async () => {
      try {
        const resDestacados = await fetch('http://localhost:3001/api/productos/destacados');
        const resMasVendidos = await fetch('http://localhost:3001/api/productos/mas-vendidos');
        const resOferta = await fetch('http://localhost:3001/api/productos/oferta');

        const dataDestacados = await resDestacados.json();
        const dataMasVendidos = await resMasVendidos.json();
        const dataOferta = await resOferta.json();

        setDestacados(dataDestacados);
        setMasVendidos(dataMasVendidos);
        setOferta(dataOferta);
      } catch (err) {
        console.error('Error al cargar secciones del home:', err);
      }
    };

    cargarSecciones();
  }, []);

  return (
    <div className="min-h-screen bg-purple-900 text-white pb-24">
      {/* Navbar principal */}
      <nav className="flex items-center justify-between px-6 py-4 bg-purple-800 shadow-md">
        <span className="text-3xl" aria-hidden>🐾</span>

        <h1 className="text-2xl font-bold">KokoShop</h1>

        <div className="flex items-center gap-4 relative text-lg">
          {/* Favoritos */}
          <Link to="/favorites" className="relative" aria-label="Favoritos">
            <FaHeart />
            {favorites.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* Carrito */}
          <Link to="/Cart" className="relative" aria-label="Carrito">
            <FaShoppingBag />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          <button type="button" className="text-white/90" aria-label="Menú">
            <FaBars />
          </button>
        </div>
      </nav>

      {/* Barra secundaria (saludo) */}
      <div className="bg-gradient-to-r from-purple-700 to-fuchsia-700 text-purple-50 text-center py-2 shadow-inner">
        <p className="text-xs sm:text-sm md:text-base">
          👋 Bienvenido, <span className="font-semibold">{usuario_nombre}</span>
        </p>
      </div>

      {/* Hero */}
      <section className="bg-purple-800 rounded-3xl m-4 p-6 text-center text-purple-100">
        <h2 className="text-3xl font-bold mb-4">Shop the Cutest Products</h2>
        <button className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-full font-medium text-lg">
          Shop Now
        </button>
      </section>

      {/* ⭐ Productos Destacados */}
      {destacados.length > 0 && (
        <section className="px-6 mt-8">
          <h2 className="text-2xl font-bold text-yellow-300 mb-4">⭐ Productos Destacados</h2>
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
          <h2 className="text-2xl font-bold text-orange-300 mb-4">🔥 Más Vendidos</h2>
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
          <h2 className="text-2xl font-bold text-red-300 mb-4">💥 Productos en Oferta</h2>
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
          className="inline-block bg-pink-500 hover:bg-pink-600 text-white py-3 px-6 rounded-full text-lg font-bold transition"
        >
          📦 Ir al Catálogo Completo
        </Link>
      </div>

      {/* Footer */}
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
        <Link to="/menu" className="flex flex-col items-center text-sm">
          <FaBars className="text-xl" />
          Menu
        </Link>
      </footer>

      {/* MiniCart reutilizable */}
      <MiniCart cartPath="/Cart" checkoutMode="query" />
    </div>
  );
};

export default Home;
