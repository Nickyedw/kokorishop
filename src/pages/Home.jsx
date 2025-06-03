import React, { useContext } from 'react';
import { FaHome, FaHeart, FaShoppingBag, FaBars } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FavoritesContext } from "../context/FavoritesContext";

const Home = () => {
    const { cartItems, addToCart } = useContext(CartContext);
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useContext(FavoritesContext);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const productos = [
    { id: 1, name: 'Kawaii', emoji: '🐱', price: 12 },
    { id: 2, name: 'Accesorios', emoji: '🎧', price: 20 },
    { id: 3, name: 'Electrónica', emoji: '🎮', price: 99 },
    { id: 4, name: 'Hogar', emoji: '⭐', price: 18 },
  ];

  return (
    <div className="min-h-screen bg-purple-900 text-white font-sans">
      
      {/* ✅ Navbar con contadores */}
      <nav className="flex items-center justify-between px-6 py-4 bg-purple-800 shadow-md">
      <span className="text-3xl">🐾</span>
        <h1 className="text-xl font-bold">KokoShop</h1>
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

    {/* Banner */}
      <section className="bg-purple-800 rounded-3xl m-4 p-6 text-center text-purple-100">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop the Cutest Products</h2>
        <button className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-full font-medium text-lg">
          Shop Now
        </button>
      </section>

      <section className="px-6 py-4">
        <h3 className="text-xl font-semibold mb-4 text-purple-100">Popular Products</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {productos.map((product) => (
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

              {/* Botón de favorito 💖 */}
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


    </div>
  );
};

export default Home;
