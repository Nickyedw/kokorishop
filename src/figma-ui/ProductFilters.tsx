// src/figma-ui/ProductFilters.tsx
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";
import { useState, useEffect, useCallback } from "react";

export type ProductFiltersState = {
  sortBy: "popular" | "newest" | "price-low" | "price-high" | "rating";
  categories: string[]; // IDs de categoría
  priceRange: [number, number];
  ratingAtLeast: number | null;
  inStock: boolean;
  onSale: boolean;
  isNew: boolean;
};

type Props = {
  onFiltersChange?: (filters: ProductFiltersState) => void;
};

// 🔑 Base de la API
const API_APP =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3001";
const API_BASE = `${API_APP}/api`;

export function ProductFilters({ onFiltersChange }: Props) {
  // === ESTADO LOCAL DE LOS FILTROS ===
  const [sortBy, setSortBy] = useState<ProductFiltersState["sortBy"]>(
    "popular"
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [ratingAtLeast, setRatingAtLeast] = useState<number | null>(null);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [activeFilters, setActiveFilters] = useState(0);

  // Categorías venidas del backend
  type UiCategory = { id: string; label: string; count: number };
  const [categories, setCategories] = useState<UiCategory[]>([]);

  /* =========================
     Cargar categorías con conteo
     ========================= */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/categorias`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (!alive || !Array.isArray(data)) return;

        const uiCats: UiCategory[] = data.map((c: any) => ({
          id: String(c.id),
          label: c.nombre,
          count: Number(c.total_productos ?? 0),
        }));

        setCategories(uiCats);
      } catch (err) {
        console.error("❌ Error cargando categorías:", err);
        // si falla, dejamos categories vacías (sin romper la UI)
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // === HELPER PARA EMITIR FILTROS AL PADRE Y CONTAR ACTIVOS ===
  const emitFilters = useCallback(() => {
    const filters: ProductFiltersState = {
      sortBy,
      categories: selectedCategories,
      priceRange,
      ratingAtLeast,
      inStock,
      onSale,
      isNew,
    };

    let count = 0;
    if (sortBy !== "popular") count++;
    if (selectedCategories.length > 0) count++;
    if (ratingAtLeast != null) count++;
    if (inStock) count++;
    if (onSale) count++;
    if (isNew) count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 500) count++;

    setActiveFilters(count);
    onFiltersChange?.(filters);
  }, [
    sortBy,
    selectedCategories,
    priceRange,
    ratingAtLeast,
    inStock,
    onSale,
    isNew,
    onFiltersChange,
  ]);

  useEffect(() => {
    emitFilters();
  }, [emitFilters]);

  const toggleCategory = (id: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((c) => c !== id);
    });
  };

  const clearAll = () => {
    setSortBy("popular");
    setSelectedCategories([]);
    setPriceRange([0, 500]);
    setRatingAtLeast(null);
    setInStock(false);
    setOnSale(false);
    setIsNew(false);
    setActiveFilters(0);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <h3 className="mb-3 text-white">Ordenar por</h3>
        <RadioGroup
          value={sortBy}
          onValueChange={(v: ProductFiltersState["sortBy"]) => setSortBy(v)}
        >
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="popular" id="popular" />
            <Label htmlFor="popular" className="cursor-pointer text-gray-300">
              Más Populares
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="newest" id="newest" />
            <Label htmlFor="newest" className="cursor-pointer text-gray-300">
              Más Recientes
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="price-low" id="price-low" />
            <Label htmlFor="price-low" className="cursor-pointer text-gray-300">
              Precio: Bajo a Alto
            </Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="price-high" id="price-high" />
            <Label
              htmlFor="price-high"
              className="cursor-pointer text-gray-300"
            >
              Precio: Alto a Bajo
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rating" id="rating" />
            <Label htmlFor="rating" className="cursor-pointer text-gray-300">
              Mejor Valorados
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="border-t border-fuchsia-500/20" />

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-white">Categorías</h3>
        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-xs text-gray-400">Cargando categorías…</p>
          )}

          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) =>
                  toggleCategory(category.id, checked === true)
                }
              />
              <Label
                htmlFor={category.id}
                className="cursor-pointer flex-1 flex justify-between text-gray-300"
              >
                <span>{category.label}</span>
                <span className="text-gray-500 text-sm">
                  ({category.count})
                </span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-fuchsia-500/20" />

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-white">Rango de Precio</h3>
        <div className="space-y-4">
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={priceRange[0]}
            onChange={(e) => {
              const v = Number(e.target.value);
              const min = Math.min(v, priceRange[1] - 50);
              setPriceRange([
                min,
                Math.max(min + 50, priceRange[1] ?? min + 50),
              ]);
            }}
            className="w-full accent-fuchsia-500"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="bg-fuchsia-500/20 text-white px-3 py-1 rounded-full">
              S/ {priceRange[0]}
            </span>
            <span className="text-gray-400">-</span>
            <span className="bg-fuchsia-500/20 text-white px-3 py-1 rounded-full">
              S/ {priceRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-3 text-white">Valoración</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${stars}`}
                checked={ratingAtLeast === stars}
                onCheckedChange={(checked) =>
                  setRatingAtLeast(checked === true ? stars : null)
                }
              />
              <Label
                htmlFor={`rating-${stars}`}
                className="cursor-pointer flex items-center gap-1 text-gray-300"
              >
                <span className="flex">
                  {[...Array(stars)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                  {[...Array(5 - stars)].map((_, i) => (
                    <span key={i} className="text-gray-600">
                      ★
                    </span>
                  ))}
                </span>
                <span className="text-sm text-gray-400">y más</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-fuchsia-500/20" />

      {/* Availability */}
      <div>
        <h3 className="mb-3 text-white">Disponibilidad</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={inStock}
              onCheckedChange={(checked) => setInStock(checked === true)}
            />
            <Label
              htmlFor="in-stock"
              className="cursor-pointer text-gray-300"
            >
              En Stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={onSale}
              onCheckedChange={(checked) => setOnSale(checked === true)}
            />
            <Label htmlFor="on-sale" className="cursor-pointer text-gray-300">
              En Oferta
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="new"
              checked={isNew}
              onCheckedChange={(checked) => setIsNew(checked === true)}
            />
            <Label htmlFor="new" className="cursor-pointer text-gray-300">
              Nuevos
            </Label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/10"
        onClick={clearAll}
      >
        <X className="h-4 w-4 mr-2" />
        Limpiar Filtros
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-gradient-to-br from-purple-950 to-fuchsia-950 rounded-2xl shadow-md p-6 border-2 border-fuchsia-500/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-fuchsia-400" />
              Filtros
            </h2>
            {activeFilters > 0 && (
              <Badge className="bg-fuchsia-500 text-white">
                {activeFilters}
              </Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

     {/* Mobile Filters */}
<div className="lg:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button
        variant="outline"
        className="w-full border-2 border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-full bg-black/50 backdrop-blur-sm"
      >
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        Filtros y Ordenar
        {activeFilters > 0 && (
          <Badge className="ml-2 bg-fuchsia-500 text-white">
            {activeFilters}
          </Badge>
        )}
      </Button>
    </SheetTrigger>

    <SheetContent
      side="bottom"
      className="
        inset-x-0 bottom-0
        max-w-sm w-full mx-auto
        h-[82vh] max-h-[620px]
        bg-gradient-to-br from-purple-900 via-purple-950 to-fuchsia-900
        border-t-2 border-fuchsia-500/30
        rounded-t-[28px]
        overflow-y-auto
        pt-4 pb-24 px-4
      "
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 text-white">
          <SlidersHorizontal className="h-5 w-5 text-fuchsia-400" />
          Filtros y Ordenar
        </SheetTitle>
      </SheetHeader>

      <div className="mt-4">
        <FilterContent />
      </div>

      {/* Botón fijo al fondo del panel, no de toda la página */}
      <div
        className="
          sticky bottom-0
          -mx-4 px-4
          pt-3 pb-3
          bg-gradient-to-t from-purple-950/95 via-purple-950/80 to-transparent
        "
      >
        <SheetClose asChild>
          <Button className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 rounded-full border-2 border-white/10">
            Aplicar Filtros
          </Button>
        </SheetClose>
      </div>
    </SheetContent>
  </Sheet>
</div>

    </>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs rounded-full ${className}`}
    >
      {children}
    </span>
  );
}
