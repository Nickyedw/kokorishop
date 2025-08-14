// context/FavoritesProvider.jsx
import React, { useEffect, useState } from 'react';
import { FavoritesContext } from './FavoritesContext';

const STORAGE_KEY = 'favorites';

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      // Puede fallar si el navegador bloquea storage (modo incógnito/restricciones)
      console.warn('No se pudo leer favoritos de localStorage:', err);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (err) {
      // Evita el error de bloque vacío y deja registro para debugging
      console.warn('No se pudo guardar favoritos en localStorage:', err);
    }
  }, [favorites]);

  const addToFavorites = (product) => {
    setFavorites((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromFavorites = (productId) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  const isFavorite = (productId) => favorites.some((p) => p.id === productId);

  return (
    <FavoritesContext.Provider
      value={{ favorites, addToFavorites, removeFromFavorites, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
