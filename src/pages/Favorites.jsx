// src/pages/Favorites.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoritesContext } from '../context/FavoritesContext';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { FaShoppingCart } from 'react-icons/fa';
import MiniCart from '../components/MiniCart';

// 🔗 Base del backend para imágenes
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 🖼️ Helper para construir URL de imagen
function getImageSrc(item) {
  const raw =
    item.imagen_url || item.image || item.imagen || item.foto || item.url_imagen;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw; // absoluta
  if (raw.startsWith('/')) return `${API_BASE}${raw}`; // /uploads/...
  return `${API_BASE}/uploads/${raw}`; // solo nombre de archivo
}

const Favorites = () => {
  const usuario_nombre = localStorage.getItem('usuario_nombre') || 'Invitado';
  const navigate = useNavigate();

  const { favorites, removeFromFavorites } = useContext(FavoritesContext);
  const { addToCart } = useContext(CartContext) || { addToCart: null };

  // Agregar al carrito desde favoritos
  const handleAddToCart = (p) => {
    const price = Number(p.precio ?? p.price ?? 0);
    const stock = Number(p.stock_actual ?? p.stock ?? 0);

    if (stock <= 0) {
      toast.warn('⛔ Sin stock disponible');
      return;
    }

    const item = {
      id: p.id,
      name: p.nombre ?? p.name,
      price,
      quantity: 1,
      imagen_url: p.imagen_url ?? p.image ?? p.imagen,
      stock_actual: stock,
    };

    if (addToCart) {
      addToCart(item);
      toast.success('🛒 Agregado al carrito');
      // abrir el MiniCart reutilizable
      window.dispatchEvent(new CustomEvent('minicart:open'));
    } else {
      toast.info('Configura CartContext.addToCart para usar esta acción');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          💖 Favoritos de {usuario_nombre}
        </h1>
        <button
          onClick={() => navigate('/')}
          className="rounded-full bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 text-sm font-medium transition"
        >
          ← Volver a la tienda
        </button>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {favorites.length === 0 ? (
          <div className="min-h-[50vh] grid place-items-center">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center max-w-md">
              <div className="text-5xl mb-2">💔</div>
              <h2 className="text-xl font-semibold">Aún no tienes favoritos</h2>
              <p className="text-purple-200 mt-2">
                Marca productos como favoritos para verlos aquí.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-block mt-6 bg-pink-500 hover:bg-pink-600 rounded-full px-6 py-3 font-semibold"
              >
                Ver productos
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => {
              const name = product.nombre || product.name;
              const price = Number(product.precio || product.price || 0);
              const img = getImageSrc(product);
              const sinStock =
                product.stock_actual !== undefined &&
                Number(product.stock_actual) <= 0;

              return (
                <article
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-purple-200 hover:shadow-md transition"
                >
                  {/* Imagen */}
                  <div className="relative h-48 w-full bg-purple-50">
                    {img ? (
                      <img
                        src={img}
                        alt={name}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-4xl text-purple-300">
                        {product.emoji || '🛍️'}
                      </div>
                    )}

                    {/* Quitar de favoritos */}
                    <button
                      onClick={() => removeFromFavorites(product.id)}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white text-pink-600 rounded-full px-3 py-2 shadow text-sm font-semibold"
                      title="Quitar de favoritos"
                      aria-label="Quitar de favoritos"
                    >
                      💔
                    </button>

                    {/* Badge stock */}
                    {sinStock && (
                      <span className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Sin stock
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-purple-900 line-clamp-2">{name}</h3>
                    <div className="mt-1 text-purple-700">
                      Precio: <span className="font-bold">S/ {price.toFixed(2)}</span>
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-2 font-medium shadow hover:shadow-md transition disabled:opacity-60"
                        disabled={sinStock}
                        title="Agregar al carrito"
                      >
                        <FaShoppingCart />
                        Agregar al carrito
                      </button>

                      <button
                        onClick={() => removeFromFavorites(product.id)}
                        className="rounded-full border border-pink-300 text-pink-600 hover:bg-pink-50 px-4 py-2 font-medium"
                        title="Quitar de favoritos"
                      >
                        💔
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* MiniCart reutilizable */}
      <MiniCart cartPath="/Cart" checkoutMode="query" />
    </div>
  );
};

export default Favorites;
