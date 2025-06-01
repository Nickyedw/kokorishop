import React from 'react';
import { FaHome, FaHeart, FaShoppingBag, FaBars } from 'react-icons/fa';
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-purple-900 text-white font-sans">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-purple-800 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐾</span>
          <h1 className="text-2xl font-bold text-purple-100">kokoshop</h1>
        </div>
        <nav className="space-x-4 hidden md:block">
          <a href="#" className="text-purple-200 hover:text-white">Kawaii</a>
          <a href="#" className="text-purple-200 hover:text-white">Accesorios</a>
          <a href="#" className="text-purple-200 hover:text-white">Juguetes</a>
        </nav>
        <button className="md:hidden text-purple-200 text-xl">
          <FaBars />
        </button>
      </header>

      {/* Banner */}
      <section className="bg-purple-800 rounded-3xl m-4 p-6 text-center text-purple-100">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop the Cutest Products</h2>
        <button className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-full font-medium text-lg">
          Shop Now
        </button>
      </section>

      {/* Productos populares */}
      <section className="px-6 py-4">
        <h3 className="text-xl font-semibold mb-4 text-purple-100">Popular Products</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Kawaii', emoji: '🐱', price: '$12' },
            { name: 'Accesorios', emoji: '🎧', price: '$20' },
            { name: 'Electrónica', emoji: '🎮', price: '$99' },
            { name: 'Hogar', emoji: '⭐', price: '$18' },
          ].map((product, index) => (
            <div key={index} className="bg-purple-100 text-purple-800 rounded-xl p-4 text-center shadow-md">
              <div className="text-4xl mb-2">{product.emoji}</div>
              <p className="font-semibold mb-1">{product.name}</p>
              <p className="font-bold">{product.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Nav */}
      <footer className="fixed bottom-0 left-0 right-0 bg-purple-800 text-purple-200 shadow-inner flex justify-around py-3 rounded-t-3xl">
      <Link to="/" className="flex flex-col items-center text-sm">
        <FaHome className="text-xl" />
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