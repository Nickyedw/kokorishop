// ProductCard.jsx
import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';

const API_URL = 'http://localhost:3001';

const ProductCard = ({ producto }) => {
  const { addToCart } = useContext(CartContext);
  const { isFavorite, addToFavorites, removeFromFavorites } = useContext(FavoritesContext);

  const imageUrl = producto.imagen_url
    ? `${API_URL}${producto.imagen_url.startsWith('/') ? '' : '/'}${producto.imagen_url}`
    : '/img/no-image.png';

  const handleFavoriteToggle = () => {
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id);
    } else {
      addToFavorites(producto);
    }
  };

  return (
    <div className="bg-white text-purple-800 rounded-xl p-4 text-center shadow-md relative">
      <img
        src={imageUrl}
        alt={producto.nombre}
        className="w-full h-40 object-contain rounded-md mb-2"
      />
      <p className="font-semibold mb-1">{producto.nombre}</p>
      <p className="text-sm mb-1 text-gray-600">{producto.descripcion}</p>
      <p className="font-bold mb-2">S/ {producto.precio}</p>
      <button
        onClick={() =>
          addToCart({
            id: producto.id,
            name: producto.nombre,
            price: producto.precio,
            stock_actual: producto.stock_actual, // ✅ Pasamos el stock
            imagen_url: producto.imagen_url
          })
        }
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm"
      >
        Agregar al carrito
      </button>
      <button
        onClick={handleFavoriteToggle}
        className="absolute top-2 right-2 text-pink-500 text-xl hover:scale-110 transition-transform"
        title="Favorito"
      >
        {isFavorite(producto.id) ? '💖' : '🤍'}
      </button>
    </div>
  );
};

export default ProductCard;
