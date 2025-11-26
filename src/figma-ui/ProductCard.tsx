// src/figma-ui/ProductCard.tsx
import { Heart, ShoppingCart, Eye, Star, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  discount?: number;
  inStock?: boolean;
  onQuickView?: () => void;
  onAddToCart?: () => void;
}

export function ProductCard({
  name,
  description,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  isNew,
  discount,
  inStock = true,
  onQuickView,
  onAddToCart
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative bg-gradient-to-br from-purple-950 to-fuchsia-950 rounded-2xl shadow-md hover:shadow-2xl hover:shadow-fuchsia-500/20 transition-all duration-300 overflow-hidden border-2 border-fuchsia-500/20 hover:border-fuchsia-500/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isNew && (
          <Badge className="bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white border-2 border-black shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Nuevo
          </Badge>
        )}
        {discount && (
          <Badge className="bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white border-2 border-black shadow-lg">
            -{discount}%
          </Badge>
        )}
        {!inStock && (
          <Badge variant="secondary" className="bg-gray-900 text-white border-2 border-black shadow-lg">
            Agotado
          </Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={() => setIsFavorite(!isFavorite)}
        className="absolute top-3 right-3 z-10 bg-black/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:scale-110 transition-transform border border-fuchsia-500/30"
        aria-label="Agregar a favoritos"
      >
        <Heart
          className={`h-5 w-5 ${
            isFavorite ? "fill-fuchsia-500 text-fuchsia-500" : "text-gray-400"
          } transition-colors`}
        />
      </button>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-black to-purple-900">
        <ImageWithFallback
          src={image}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
        />

        {/* Quick View Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Button
            onClick={onQuickView}
            size="sm"
            className="bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white hover:from-fuchsia-700 hover:to-pink-600 rounded-full shadow-xl transform hover:scale-105 transition-all border-2 border-white/20"
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Rápida
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 md:p-4 space-y-2 md:space-y-3">
        {/* Rating */}
        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 md:h-4 md:w-4 ${
                  i < Math.floor(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-600"
                }`}
              />
            ))}
          </div>
          <span className="text-xs md:text-sm text-gray-400">
            {rating} <span className="text-gray-500">({reviews})</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white text-sm md:text-base line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] group-hover:text-fuchsia-400 transition-colors">
          {name}
        </h3>

        {/* Description */}
        <p className="text-xs md:text-sm text-gray-400 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem] hidden md:block">{description}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl md:text-2xl text-fuchsia-400">S/ {price.toFixed(2)}</span>
          {originalPrice && (
            <span className="text-xs md:text-sm text-gray-500 line-through">
              S/ {originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={onAddToCart}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:shadow-fuchsia-500/50 transform hover:scale-105 transition-all duration-300 rounded-full group border-2 border-white/10 text-xs md:text-sm py-4 md:py-5"
          disabled={!inStock}
        >
          <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 group-hover:animate-bounce" />
          <span className="hidden sm:inline">{inStock ? "Agregar al Carrito" : "No Disponible"}</span>
          <span className="sm:hidden">{inStock ? "Agregar" : "Agotado"}</span>
        </Button>
      </div>
    </div>
  );
}
