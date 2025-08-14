// src/components/ProductCard.jsx
import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ProductCard = ({ producto, onAddedToCart }) => {
  const { addToCart } = useContext(CartContext);
  const { isFavorite, addToFavorites, removeFromFavorites } = useContext(FavoritesContext);

  // Construir URL de imagen (acepta absoluta, /uploads/... o nombre suelto)
  const imageUrl = (() => {
    const raw = producto.imagen_url;
    if (!raw) return '/img/no-image.png';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) return `${API_BASE}${raw}`;
    return `${API_BASE}/uploads/${raw}`;
  })();

  const price = Number(producto.precio ?? 0);
  const stock = Number(producto.stock_actual ?? producto.stock ?? 0);
  const sinStock = stock <= 0;

  const handleFavoriteToggle = () => {
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id);
    } else {
      addToFavorites(producto);
    }
  };

  const handleAdd = () => {
    const item = {
      id: producto.id,
      name: producto.nombre,
      price,
      quantity: 1,
      imagen_url: producto.imagen_url,
      stock_actual: stock,
    };
    addToCart(item);
    // Abrir MiniCart si nos pasaron el callback desde la página
    onAddedToCart?.();
  };

  return (
    <div className="bg-white text-purple-800 rounded-xl p-4 text-center shadow-md relative">
      <div className="relative">
        <img
          src={imageUrl}
          alt={producto.nombre}
          className="w-full h-40 object-contain rounded-md mb-2"
          onError={(e) => (e.currentTarget.src = '/img/no-image.png')}
        />
        {sinStock && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Sin stock
          </span>
        )}
      </div>

      <p className="font-semibold mb-1 line-clamp-2">{producto.nombre}</p>
      {producto.descripcion && (
        <p className="text-sm mb-1 text-gray-600 line-clamp-2">{producto.descripcion}</p>
      )}
      <p className="font-bold mb-2">S/ {price.toFixed(2)}</p>

      <button
        onClick={handleAdd}
        disabled={sinStock}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded-full text-sm"
        title={sinStock ? 'Sin stock disponible' : 'Agregar al carrito'}
        aria-label="Agregar al carrito"
      >
        Agregar al carrito
      </button>

      <button
        onClick={handleFavoriteToggle}
        className="absolute top-2 right-2 text-pink-500 text-xl hover:scale-110 transition-transform"
        title="Favorito"
        aria-label="Alternar favorito"
      >
        {isFavorite(producto.id) ? '💖' : '🤍'}
      </button>
    </div>
  );
};

export default ProductCard;
