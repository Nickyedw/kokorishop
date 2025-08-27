// src/context/CartProvider.jsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { CartContext } from './CartContext';
import { toast } from 'react-toastify';

/** Helpers de usuario para namespacing del carrito */
function getUserKey() {
  const id = localStorage.getItem('usuario_id');
  const email = localStorage.getItem('usuario_email') || localStorage.getItem('email');
  const username = localStorage.getItem('usuario_nombre');
  const base = id || email || username || 'guest';
  return String(base).trim().toLowerCase().replace(/\s+/g, '_');
}
const cartKeyFor = (key) => `cart_${key}`;

/** Merge de carritos (guest -> user) */
function mergeCartItems(guest, user) {
  const map = new Map();
  // primero el user (prioridad a lo existente)
  user.forEach((it) => map.set(it.id, { ...it }));
  // luego sumamos del guest
  guest.forEach((g) => {
    const current = map.get(g.id);
    if (!current) {
      map.set(g.id, { ...g });
    } else {
      const nextQty = Number(current.quantity || 1) + Number(g.quantity || 1);
      const capped =
        current.stock_actual != null ? Math.min(nextQty, current.stock_actual) : nextQty;
      map.set(g.id, { ...current, quantity: capped });
    }
  });
  return Array.from(map.values());
}

/** === NUEVO: helper oferta -> normaliza precios === */
function normalizePricing(p) {
  // precio actual (oferta si la hay)
  const priceNow = Number(p.price ?? p.precio ?? p.precio_oferta ?? 0);

  // precio “antes”: soporta varios nombres
  const regular =
    p.regular_price ??
    p.precio_regular ??
    p.precio_anterior ??
    (p.en_oferta && p.precio ? Number(p.precio) : undefined);

  const regularNum = regular != null ? Number(regular) : undefined;

  // bandera oferta
  const en_oferta =
    Boolean(p.en_oferta) && regularNum != null && regularNum > priceNow;

  // si no está en oferta, regular cae a priceNow para evitar NaN en totales
  const regularSafe = regularNum != null ? regularNum : priceNow;

  return {
    price: priceNow,            // precio que se cobrará
    offer_price: priceNow,      // alias útil si lo necesitas en UI
    regular_price: regularSafe, // precio base para “antes”
    en_oferta,                  // true/false
  };
}

export const CartProvider = ({ children }) => {
  const [userKey, setUserKey] = useState(getUserKey());
  const prevUserKeyRef = useRef(userKey);
  const [cartItems, setCartItems] = useState([]);

  const loadCart = useCallback((key) => {
    try {
      const raw = localStorage.getItem(cartKeyFor(key));
      const parsed = raw ? JSON.parse(raw) : [];
      setCartItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCartItems([]);
    }
  }, []);

  const saveCart = useCallback((key, items) => {
    try {
      localStorage.setItem(cartKeyFor(key), JSON.stringify(items));
    } catch (err) {
      console.warn('No se pudo guardar el carrito en localStorage:', err);
    }
  }, []);

  /** === NUEVO: totales con soporte de ofertas === */
  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1),
        0
      ),
    [cartItems]
  );

  const regularSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, it) =>
          acc +
          Number(it.regular_price ?? it.price ?? 0) * Number(it.quantity || 1),
        0
      ),
    [cartItems]
  );

  const savingsTotal = useMemo(
    () => Math.max(0, regularSubtotal - subtotal),
    [regularSubtotal, subtotal]
  );

  const savingsPct = useMemo(() => {
    if (!regularSubtotal) return 0;
    return Math.round((savingsTotal / regularSubtotal) * 100);
  }, [savingsTotal, regularSubtotal]);

  const normalizeItem = (p) => {
    const pr = normalizePricing(p);
    return {
      id: p.id,
      name: p.name ?? p.nombre ?? '',
      price: pr.price,                  // precio actual a cobrar
      offer_price: pr.offer_price,      // alias
      regular_price: pr.regular_price,  // “antes”
      en_oferta: pr.en_oferta,
      quantity: Number(p.quantity ?? 1),
      imagen_url: p.imagen_url ?? p.image ?? p.imagen ?? null,
      stock_actual:
        p.stock_actual != null
          ? Number(p.stock_actual)
          : p.stock != null
          ? Number(p.stock)
          : undefined,
    };
  };

  const addToCart = (producto) => {
    const item = normalizeItem(producto);
    setCartItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (item.stock_actual != null && item.stock_actual <= 0) {
        toast.warn('😢 Producto sin stock disponible');
        return prev;
      }
      if (idx === -1) {
        const qty = Math.max(1, item.quantity || 1);
        const finalQty = item.stock_actual != null ? Math.min(qty, item.stock_actual) : qty;
        return [...prev, { ...item, quantity: finalQty }];
      }
      const copy = [...prev];
      const current = copy[idx];

      // === NUEVO: si el producto ahora viene con oferta/regular distintos, refrescamos precios
      const refreshed = normalizeItem({ ...current, ...producto });

      const nextQty =
        Number(current.quantity || 1) + Number(item.quantity || 1);
      if (current.stock_actual != null && nextQty > current.stock_actual) {
        toast.warn(`😢 Stock máximo alcanzado: ${current.stock_actual}`);
        copy[idx] = { ...refreshed, quantity: current.stock_actual };
      } else {
        copy[idx] = { ...refreshed, quantity: nextQty };
      }
      return copy;
    });
  };

  const removeFromCart = (id) =>
    setCartItems((prev) => prev.filter((item) => item.id !== id));

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

  const updateQuantity = (id, tipo) => {
    if (tipo === 'increment') increaseQuantity(id);
    if (tipo === 'decrement') decreaseQuantity(id);
  };

  /** Cargar carrito del usuario actual */
  useEffect(() => {
    loadCart(userKey);
  }, [userKey, loadCart]);

  /** Guardar al cambiar */
  useEffect(() => {
    saveCart(userKey, cartItems);
  }, [userKey, cartItems, saveCart]);

  /** Reaccionar a cambios de sesión y a limpiezas */
  useEffect(() => {
    const onAuthChanged = () => {
      const newKey = getUserKey();
      const prevKey = prevUserKeyRef.current;

      // ✅ LOGOUT: venías con usuario y ahora eres guest ⇒ vaciar carrito guest
      if (prevKey !== 'guest' && newKey === 'guest') {
        try {
          localStorage.setItem(cartKeyFor('guest'), JSON.stringify([]));
        } catch (err) {
          console.warn('Error limpiando carrito guest:', err);
        }
        setUserKey('guest');
        setCartItems([]);
        prevUserKeyRef.current = 'guest';
        return;
      }

      // ✅ LOGIN: fusiona carrito de invitado con el del usuario
      if (prevKey === 'guest' && newKey !== 'guest') {
        let guest = [];
        try {
          const rawGuest = localStorage.getItem(cartKeyFor('guest'));
          guest = rawGuest ? JSON.parse(rawGuest) : [];
        } catch (err) {
          console.warn('Error leyendo carrito guest:', err);
        }

        let user = [];
        try {
          const rawUser = localStorage.getItem(cartKeyFor(newKey));
          user = rawUser ? JSON.parse(rawUser) : [];
        } catch (err) {
          console.warn('Error leyendo carrito user:', err);
        }

        const merged = mergeCartItems(guest, user);
        try {
          localStorage.setItem(cartKeyFor(newKey), JSON.stringify(merged));
          localStorage.removeItem(cartKeyFor('guest'));
        } catch (err) {
          console.warn('Error guardando carrito user:', err);
        }
        setUserKey(newKey);
        setCartItems(merged);
        prevUserKeyRef.current = newKey;
        return;
      }

      // Otros casos: solo actualiza key y recarga
      setUserKey(newKey);
      loadCart(newKey);
      prevUserKeyRef.current = newKey;
    };

    const onCartClear = () => setCartItems([]);

    window.addEventListener('auth:changed', onAuthChanged);
    window.addEventListener('cart:clear', onCartClear);

    const onStorage = (e) => {
      if (
        e.key === 'usuario_id' ||
        e.key === 'usuario_email' ||
        e.key === 'email' ||
        e.key === 'usuario_nombre' ||
        e.key === 'usuario_rol' ||
        e.key === 'usuario_is_admin'
      ) {
        onAuthChanged();
      }
      if (e.key === cartKeyFor(userKey)) {
        loadCart(userKey);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('auth:changed', onAuthChanged);
      window.removeEventListener('cart:clear', onCartClear);
      window.removeEventListener('storage', onStorage);
    };
  }, [userKey, loadCart]);

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

        /** === NUEVO: totales “oferta-aware” === */
        total: subtotal,            // compat: tu código usa "total"
        subtotal,                   // alias claro
        regularSubtotal,
        savingsTotal,
        savingsPct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
