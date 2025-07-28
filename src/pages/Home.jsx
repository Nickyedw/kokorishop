import React, { useEffect, useState, useContext } from 'react';
import { FaHeart, FaShoppingBag, FaBars, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getProductos } from '../services/productService';
import ProductCard from '../components/ProductCard';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';

const Home = () => {
  const { cartItems } = useContext(CartContext);
  const { favorites } = useContext(FavoritesContext);

  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await getProductos();
        setProductos(data);
      } catch (err) {
        console.error('Error cargando productos:', err);
      }
    };
    cargarProductos();
  }, []);

  const productosFiltrados = productos.filter((p) => {
    const termino = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(termino) ||
      p.descripcion.toLowerCase().includes(termino) ||
      (p.categoria_nombre?.toLowerCase().includes(termino))
    );
  });

  return (
    <div className="min-h-screen bg-purple-900 text-white pb-24">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 bg-purple-800 shadow-md">
        <span className="text-3xl">🐾</span>
        <h1 className="text-2xl font-bold">KokoShop</h1>
        <div className="flex items-center gap-4 relative text-lg">
          <Link to="/favorites" className="relative">
            <FaHeart />
            {favorites.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {favorites.length}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative">
            <FaShoppingBag />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </Link>
          <FaBars />
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-purple-800 rounded-3xl m-4 p-6 text-center text-purple-100">
        <h2 className="text-3xl font-bold mb-4">Shop the Cutest Products</h2>
        <button className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-full font-medium text-lg">
          Shop Now
        </button>
      </section>

      {/* Buscador */}
      <div className="px-6">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar productos por nombre, descripción o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-4 py-2 rounded-full text-purple-900"
          />
          <FaSearch className="absolute top-3 right-4 text-purple-600" />
        </div>

        {/* Lista de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {productosFiltrados.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
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
        <Link to="/cart" className="flex flex-col items-center text-sm">
          <FaShoppingBag className="text-xl" />
          Cart
        </Link>
        <Link to="/menu" className="flex flex-col items-center text-sm">
          <FaBars className="text-xl" />
          Menu
        </Link>
      </footer>
    </div>
  );
};

export default Home;
