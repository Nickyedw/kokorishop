import React, { useContext, useState } from 'react';
import { FaHome, FaHeart, FaShoppingBag, FaBars, FaSearch } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FavoritesContext } from "../context/FavoritesContext";

const Home = () => {
  const { cartItems, addToCart } = useContext(CartContext);
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useContext(FavoritesContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const productos = [
    { id: 1, name: 'Peluche Kawaii', emoji: '🐱', price: 12, category: 'Kawaii' },
    { id: 2, name: 'Audífonos', emoji: '🎧', price: 20, category: 'Accesorios' },
    { id: 3, name: 'Control Gamer', emoji: '🎮', price: 99, category: 'Electrónica' },
    { id: 4, name: 'Luz Nocturna', emoji: '⭐', price: 18, category: 'Hogar' },
    { id: 5, name: 'Taza Panda', emoji: '🐼', price: 10, category: 'Hogar' },
    { id: 6, name: 'Estuche Gato', emoji: '📱', price: 8, category: 'Kawaii' },
  ];

  const categorias = ['Todos', 'Kawaii', 'Accesorios', 'Electrónica', 'Hogar'];

  const productosFiltrados = productos.filter(product => {
    const porCategoria = selectedCategory === 'Todos' || product.category === selectedCategory;
    const porBusqueda = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return porCategoria && porBusqueda;
  });

  return (
    <div className="min-h-screen bg-purple-900 text-white font-sans pb-24">
      <nav className="flex items-center justify-between px-6 py-4 bg-purple-800 shadow-md">
        <span className="text-3xl">🐾</span>
        <h1 className="text-2xl font-bold text-purple-100">KokoShop</h1>
        <div className="flex items-center gap-4 text-white text-lg relative">
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

      <section className="bg-purple-800 rounded-3xl m-4 p-6 text-center text-purple-100">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop the Cutest Products</h2>
        <button className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-full font-medium text-lg">
          Shop Now
        </button>
      </section>

      <section className="px-6 py-2">
        <div className="mb-4 flex flex-wrap gap-2">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                selectedCategory === cat ? 'bg-white text-purple-700' : 'bg-purple-600 text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-full text-purple-900"
          />
          <FaSearch className="absolute top-3 right-4 text-purple-600" />
        </div>

        <h3 className="text-xl font-semibold mb-4 text-purple-100">Productos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {productosFiltrados.map((product) => (
            <div key={product.id} className="bg-purple-100 text-purple-800 rounded-xl p-4 text-center shadow-md relative">
              <div className="text-4xl mb-2">{product.emoji}</div>
              <p className="font-semibold mb-1">{product.name}</p>
              <p className="font-bold mb-2">${product.price}</p>
              <button
                onClick={() => addToCart(product)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm"
              >
                Agregar al carrito
              </button>
              <button
                onClick={() =>
                  isFavorite(product.id)
                    ? removeFromFavorites(product.id)
                    : addToFavorites(product)
                }
                className="absolute top-2 right-2 text-pink-500 text-xl hover:scale-110 transition-transform"
                title="Favorito"
              >
                {isFavorite(product.id) ? '💖' : '🤍'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 bg-purple-800 text-purple-200 shadow-inner flex justify-around py-3 rounded-t-3xl">
        <Link to="/" className="flex flex-col items-center text-sm">
          <FaHome className="text-xl" />
          Home
        </Link>
        <Link to="/Favorites" className="flex flex-col items-center text-sm">
          <FaHeart className="text-xl" />
          Favorites
        </Link>
        <Link to="/Cart" className="flex flex-col items-center text-sm">
          <FaShoppingBag className="text-xl" />
          Cart
        </Link>
        <Link to="/Menu" className="flex flex-col items-center text-sm">
          <FaBars className="text-xl" />
          Menu
        </Link>
      </footer>
    </div>
  );
};

export default Home;
