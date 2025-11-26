// src/components/QuickViewModal.jsx
import React, { useState } from "react";
import {
  FaTimes,
  FaShoppingCart,
  FaHeart,
  FaRegHeart,
  FaStar,
  FaTruck,
  FaShieldAlt,
} from "react-icons/fa";
import ReactDOM from "react-dom";

export default function QuickViewModal({
  isOpen,
  onClose,
  producto,
  images = [],
  price,
  regularPrice,
  discount,
  inStock = true,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // opcional: resetear cuando se abre de nuevo
  // useEffect(() => {
  //   if (isOpen) {
  //     setQuantity(1);
  //     setSelectedImageIndex(0);
  //   }
  // }, [isOpen, producto?.id]);

  if (!isOpen || !producto) return null;

  const title =
    producto?.nombre ||
    producto?.titulo ||
    producto?.nombre_producto ||
    "Producto kawaii";

  const rating = Number(
    producto?.rating ?? producto?.calificacion_promedio ?? 4.8
  );
  const reviews = Number(
    producto?.reviews ?? producto?.total_resenas ?? 120
  );

  const basePrice =
    typeof regularPrice === "number" && regularPrice > 0
      ? regularPrice
      : typeof price === "number"
      ? price
      : Number(
          producto?.precio_regular ??
            producto?.precio ??
            producto?.price ??
            0
        ) || 0;

  const finalPrice =
    typeof price === "number" && price > 0
      ? price
      : Number(
          producto?.precio_oferta ??
            producto?.precio ??
            producto?.price ??
            0
        ) || 0;

  const hasOffer =
    basePrice > 0 && finalPrice > 0 && finalPrice < basePrice;

  const pct =
    hasOffer && basePrice > 0
      ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
      : discount || 0;

  const imgList =
    images && images.length > 0
      ? images
      : [producto?.imagen_url || "/img/placeholder-kawaii.png"];

  const handleAddToCartClick = () => {
    if (typeof onAddToCart === "function") {
      onAddToCart(quantity);
    }
  };

  const handleFavoriteClick = () => {
    if (typeof onToggleFavorite === "function") {
      onToggleFavorite();
    }
  };

  const modalContent = (
    <>
      {/* Animación suave para overlay + contenido */}
      <style>{`
        @keyframes qv-overlay-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes qv-content-pop {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div
        className="
          fixed inset-0 z-[200]
          flex items-center justify-center
          bg-black/70 backdrop-blur-sm
        "
        style={{ animation: "qv-overlay-fade 0.25s ease-out" }}
        onClick={onClose}
      >
        <div
          className="
            relative bg-white rounded-3xl shadow-2xl
            max-w-4xl w-[95%] md:w-[80%] lg:w-[70%]
            max-h-[90vh] overflow-y-auto
          "
          style={{ animation: "qv-content-pop 0.28s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="
              absolute top-3 right-3 h-9 w-9 rounded-full
              flex items-center justify-center
              bg-black/5 hover:bg-black/10
              text-gray-600 hover:text-black
              shadow-sm
            "
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>

          <div className="grid md:grid-cols-2 gap-0 md:gap-8">
            {/* Columna izquierda: imágenes */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-200/70 space-y-4">
              {/* Imagen principal */}
              <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <img
                  src={imgList[selectedImageIndex]}
                  alt={title}
                  className="w-full h-[260px] md:h-[320px] object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>

              {/* Miniaturas */}
              {imgList.length > 1 && (
                <div className="flex gap-2">
                  {imgList.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`
                        flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all
                        ${
                          idx === selectedImageIndex
                            ? "border-fuchsia-500 shadow-lg shadow-fuchsia-500/40"
                            : "border-gray-200 hover:border-fuchsia-300"
                        }
                      `}
                    >
                      <img
                        src={img}
                        alt={`${title} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Columna derecha: info producto */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Título + stock */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {rating.toFixed(1)} ({reviews} reseñas)
                  </span>
                </div>

                {/* Stock */}
                <p
                  className={`text-sm font-semibold ${
                    inStock ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {inStock ? "✓ En Stock" : "✗ Agotado"}
                </p>
              </div>

              {/* Precios */}
              <div className="flex items-baseline gap-3">
                <p className="text-2xl md:text-2xl text-purple-600">
                  S/ {finalPrice.toFixed(2)}
                </p>
                {hasOffer && (
                  <>
                    <p className="text-sm line-through text-gray-400">
                      S/ {basePrice.toFixed(2)}
                    </p>
                    {pct > 0 && (
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-pink-500 text-white">
                        {pct}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2 text-sm text-gray-700">
                <h3 className="font-semibold text-gray-900">Descripción</h3>
                {producto?.descripcion ? (
                  <p className="leading-relaxed">{producto.descripcion}</p>
                ) : (
                  <p className="leading-relaxed">
                    Este adorable producto kawaii es perfecto para alegrar tu
                    día. Fabricado con materiales de alta calidad y diseño único
                    que te encantará. ¡Ideal para regalar o consentirte! 💕
                  </p>
                )}
              </div>

              {/* Cantidad */}
              <div>
                <h3 className="text-gray-900 mb-2 text-sm font-medium">
                  Cantidad
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-full overflow-hidden bg-white">
                    <button
                      type="button"
                      className={`
                        w-9 h-9 flex items-center justify-center text-lg hover:bg-gray-100
                        ${
                          quantity <= 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-700"
                        }
                      `}
                      onClick={() =>
                        setQuantity((q) => Math.max(1, q - 1))
                      }
                      disabled={quantity <= 1}
                    >
                      –
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-purple-900 bg-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="
                        w-9 h-9 flex items-center justify-center text-lg
                        text-gray-700 hover:bg-gray-100
                      "
                      onClick={() => setQuantity((q) => q + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  disabled={!inStock}
                  className={`
                    flex-1 inline-flex items-center justify-center gap-2
                    rounded-full px-6 py-3 text-sm font-semibold
                    bg-gradient-to-r from-fuchsia-600 to-pink-500
                    hover:from-fuchsia-700 hover:to-pink-600
                    text-white shadow-lg shadow-fuchsia-400/40
                    transition-transform hover:scale-[1.02]
                    ${
                      !inStock
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }
                  `}
                >
                  <FaShoppingCart className="h-4 w-4" />
                  {inStock ? "Agregar al Carrito" : "No disponible"}
                </button>

                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-full px-5 py-3 text-sm font-semibold
                    border border-gray-300 text-gray-700
                    hover:bg-gray-50
                  "
                >
                  {isFavorite ? (
                    <FaHeart className="h-4 w-4 text-pink-500" />
                  ) : (
                    <FaRegHeart className="h-4 w-4" />
                  )}
                  {isFavorite ? "En favoritos" : "Agregar a Favoritos"}
                </button>
              </div>

              {/* Beneficios (envío / garantía) */}
              <div className="border-t border-gray-200 pt-5 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FaTruck className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900">
                      Envío gratis en compras mayores a S/ 100
                    </p>
                    <p className="text-xs text-gray-500">
                      Entrega en 2–5 días hábiles
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900">
                      Garantía de satisfacción
                    </p>
                    <p className="text-xs text-gray-500">
                      Devoluciones dentro de 30 días
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
