// src/sections/BestSellersSection.jsx
import React, { useEffect, useState, useRef } from "react";
import ProductCard from "../components/ProductCard";

// MISMA CONVENCIÓN QUE EN Home.jsx
const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_BASE = `${API_APP}/api`;

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-sm animate-pulse">
      <div className="h-40 rounded-xl bg-white/10 mb-3" />
      <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
      <div className="h-4 w-1/2 bg-white/10 rounded" />
      <div className="mt-4 h-9 bg-white/10 rounded-lg" />
    </div>
  );
}

/**
 * BestSellersSection
 * - Carga perezosa con IntersectionObserver
 * - Skeletons para evitar CLS
 * - Prop opcional onAddedToCart para que el Home pueda enganchar su handler
 */
export default function BestSellersSection({ onAddedToCart }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  // Lazy mount cuando entra al viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const bust = `?bust=${Date.now()}`;
        const res = await fetch(`${API_BASE}/productos/mas-vendidos${bust}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible]);

  return (
    <section ref={ref} className="px-4 sm:px-6 pb-4 mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h2 className="text-orange-300 font-bold text-xl sm:text-2xl lg:text-3xl">
          Más Vendidos
        </h2>
      </div>

      {(!items && loading) ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items?.map((p) => (
            <ProductCard
              key={p.id || p.producto_id}
              producto={p}                 // ← COMPATIBLE CON TU ProductCard
              onAddedToCart={onAddedToCart} // ← opcional
            />
          ))}
          {items?.length === 0 && (
            <div className="col-span-2 sm:col-span-3 md:col-span-4 text-center text-white/70 text-sm py-6">
              Sin productos por ahora.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
