// src/context/CartProvider.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { CartContext } from './CartContext';
import { toast } from 'react-toastify';

const STORAGE_KEY = 'cart';

export const CartProvider = ({ children }) => {
  // Cargar desde localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('No se pudo leer el carrito de localStorage:', err);
      return [];
    }
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.warn('No se pudo guardar el carrito en localStorage:', err);
    }
  }, [cartItems]);

  // Subtotal
  const total = useMemo(
    () =>
      cartItems.reduce(
        (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1),
        0
      ),
    [cartItems]
  );

  // Normaliza un producto que viene de distintos lugares (Favorites, Catálogo, etc)
  const normalizeItem = (p) => ({
    id: p.id,
    name: p.name ?? p.nombre ?? '',
    price: Number(p.price ?? p.precio ?? 0),
    quantity: Number(p.quantity ?? 1),
    imagen_url: p.imagen_url ?? p.image ?? p.imagen ?? null,
    stock_actual:
      p.stock_actual != null ? Number(p.stock_actual) : (p.stock != null ? Number(p.stock) : undefined),
  });

  const addToCart = (producto) => {
    const item = normalizeItem(producto);

    setCartItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);

      // Validación de stock al agregar
      if (item.stock_actual != null && item.stock_actual <= 0) {
        toast.warn('😢 Producto sin stock disponible');
        return prev;
      }

      if (idx === -1) {
        const qty = Math.max(1, item.quantity || 1);
        const finalQty =
          item.stock_actual != null ? Math.min(qty, item.stock_actual) : qty;
        return [...prev, { ...item, quantity: finalQty }];
      }

      const copy = [...prev];
      const current = copy[idx];
      const nextQty = Number(current.quantity || 1) + Number(item.quantity || 1);

      if (current.stock_actual != null && nextQty > current.stock_actual) {
        toast.warn(`😢 Stock máximo alcanzado: ${current.stock_actual}`);
        copy[idx] = { ...current, quantity: current.stock_actual };
      } else {
        copy[idx] = { ...current, quantity: nextQty };
      }
      return copy;
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const increaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = Number(item.quantity || 1) + 1;
        if (item.stock_actual != null && next > item.stock_actual) {
          toast.warn(`😢 Stock máximo alcanzado: ${item.stock_actual}`);
          return { ...item, quantity: item.stock_actual };
        }
        return { ...item, quantity: next };
      })
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) - 1) }
          : item
      )
    );
  };

  // Ajuste directo (por si luego usas inputs)
  const setQuantity = (id, qty) => {
    const q = Math.max(1, Number(qty || 1));
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.stock_actual != null && q > item.stock_actual) {
          toast.warn(`😢 Stock máximo alcanzado: ${item.stock_actual}`);
          return { ...item, quantity: item.stock_actual };
        }
        return { ...item, quantity: q };
      })
    );
  };

  // Mantén tu API actual: updateQuantity('increment'|'decrement')
  const updateQuantity = (id, tipo) => {
    if (tipo === 'increment') increaseQuantity(id);
    if (tipo === 'decrement') decreaseQuantity(id);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQuantity,
        decreaseQuantity,
        updateQuantity,
        setQuantity,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
