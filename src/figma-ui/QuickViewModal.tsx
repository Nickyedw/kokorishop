import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ShoppingCart, Heart, Star, Minus, Plus, Truck, Shield } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface QuickViewModalProps {
  product: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating: number;
    reviews: number;
    inStock: boolean;
  } | null;
  onClose: () => void;
  onAddToCart?: () => void;
}

export function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const images = [product.image, product.image, product.image]; // Mock multiple images

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
              <ImageWithFallback
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-fuchsia-500 shadow-lg shadow-fuchsia-500/50"
                      : "border-gray-200 hover:border-fuchsia-300"
                  }`}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{product.name}</h2>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews} reseñas)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl text-purple-600">
                  S/ {product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      S/ {product.originalPrice.toFixed(2)}
                    </span>
                    <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-sm">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                {product.inStock ? (
                  <span className="text-green-600 flex items-center gap-1">
                    ✓ En Stock
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    ✗ Agotado
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-600">{product.description}</p>
              <p className="text-gray-600 mt-2">
                Este adorable producto kawaii es perfecto para alegrar tu día. 
                Fabricado con materiales de alta calidad y diseño único que te encantará. 
                ¡Ideal para regalar o consentirte! 💕
              </p>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-gray-900 mb-2">Cantidad</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="rounded-full"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={onAddToCart}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white py-6 rounded-full text-lg border-2 border-white/10 shadow-lg hover:shadow-fuchsia-500/50"
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar al Carrito
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-2 border-fuchsia-500/30 text-fuchsia-600 hover:bg-fuchsia-50 py-6 rounded-full text-lg"
              >
                <Heart className="h-5 w-5 mr-2" />
                Agregar a Favoritos
              </Button>
            </div>

            {/* Benefits */}
            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">Envío gratis en compras mayores a S/ 100</p>
                  <p className="text-xs text-gray-500">Entrega en 2-5 días hábiles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">Garantía de satisfacción</p>
                  <p className="text-xs text-gray-500">Devoluciones dentro de 30 días</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
