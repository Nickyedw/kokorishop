import React from 'react';
import { FaHeart } from 'react-icons/fa';

const Favorites = () => {
  const favoritos = [
    { name: 'Peluche Panda', emoji: '🐼', price: '$15' },
    { name: 'Lámpara Estrellita', emoji: '⭐', price: '$10' },
    { name: 'Auriculares Gato', emoji: '🎧', price: '$25' },
  ];

  return (
    <div className="min-h-screen bg-pink-100 text-pink-800 p-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <FaHeart className="text-pink-500" /> Tus Favoritos
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {favoritos.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-xl text-center shadow-md">
            <div className="text-4xl mb-2">{item.emoji}</div>
            <p className="font-semibold">{item.name}</p>
            <p className="font-bold">{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;