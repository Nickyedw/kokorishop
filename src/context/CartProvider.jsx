// CartProvider.jsx
import React, { useState } from 'react';
import { CartContext } from './CartContext';
import { toast } from 'react-toastify';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (producto) => {
    setCartItems((prev) => {
      const itemExistente = prev.find((item) => item.id === producto.id);
      if (itemExistente) {
        if (itemExistente.quantity >= producto.stock_actual) {
          toast.warn(`😢 Stock máximo alcanzado: ${producto.stock_actual}`);
          return prev;
        }
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (producto.stock_actual <= 0) {
          toast.warn(`😢 Producto sin stock disponible`);
          return prev;
        }
        return [...prev, { ...producto, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const increaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity < item.stock_actual
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

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
        updateQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
