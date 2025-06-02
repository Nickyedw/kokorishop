import React, { useContext } from 'react';
import { FavoritesContext } from '../context/FavoritesContext';

const Favorites = () => {
  const { favorites, removeFromFavorites } = useContext(FavoritesContext);

  return (
    <div className="min-h-screen bg-purple-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">💖 Tus productos favoritos</h1>

      {favorites.length === 0 ? (
        <p className="text-purple-300">No tienes productos en tu lista de favoritos.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {favorites.map((product) => (
            <div key={product.id} className="bg-purple-100 text-purple-800 rounded-xl p-4 text-center shadow-md relative">
              <div className="text-4xl mb-2">{product.emoji}</div>
              <p className="font-semibold mb-1">{product.name}</p>
              <p className="font-bold mb-2">${product.price}</p>

              {/* Botón para quitar de favoritos */}
              <button
                onClick={() => removeFromFavorites(product.id)}
                className="absolute top-2 right-2 text-pink-500 text-xl hover:scale-110 transition-transform"
                title="Quitar de favoritos"
              >
                💔
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
