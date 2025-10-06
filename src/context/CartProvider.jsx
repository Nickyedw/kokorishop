// src/context/CartProvider.jsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { CartContext } from "./CartContext";
import { toast } from "react-toastify";

/* =========================
   Helpers de usuario / claves
   ========================= */
function getUserKey() {
  const id = localStorage.getItem("usuario_id");
  const email = localStorage.getItem("usuario_email") || localStorage.getItem("email");
  const username = localStorage.getItem("usuario_nombre");
  const base = id || email || username || "guest";
  return String(base).trim().toLowerCase().replace(/\s+/g, "_");
}
const cartKeyFor = (key) => `cart_${key}`;

/* Merge de carritos (guest -> user) */
function mergeCartItems(guest, user) {
  const map = new Map();
  user.forEach((it) => map.set(it.id, { ...it }));
  guest.forEach((g) => {
    const cur = map.get(g.id);
    if (!cur) {
      map.set(g.id, { ...g });
    } else {
      const nextQty = Number(cur.quantity || 1) + Number(g.quantity || 1);
      const capped =
        cur.stock_actual != null ? Math.min(nextQty, cur.stock_actual) : nextQty;
      map.set(g.id, { ...cur, quantity: capped });
    }
  });
  return Array.from(map.values());
}

/* === Precios con oferta (normaliza) === */
function normalizePricing(p) {
  const priceNow = Number(p.price ?? p.precio ?? p.precio_oferta ?? 0);
  const regular =
    p.regular_price ??
    p.precio_regular ??
    p.precio_anterior ??
    (p.en_oferta && p.precio ? Number(p.precio) : undefined);
  const regularNum = regular != null ? Number(regular) : undefined;
  const en_oferta = Boolean(p.en_oferta) && regularNum != null && regularNum > priceNow;
  const regularSafe = regularNum != null ? regularNum : priceNow;

  return {
    price: priceNow,
    offer_price: priceNow,
    regular_price: regularSafe,
    en_oferta,
  };
}

export const CartProvider = ({ children }) => {
  const [userKey, setUserKey] = useState(getUserKey());
  const prevUserKeyRef = useRef(userKey);
  const [cartItems, setCartItems] = useState([]);

  /* ==== Persistencia + eventos (canónico + por-usuario) ==== */
  const persist = useCallback((key, items) => {
    try {
      // por usuario
      localStorage.setItem(cartKeyFor(key), JSON.stringify(items));
      // canónico (lo lee CartFab/MiniCart/useCartTotals)
      localStorage.setItem("cart", JSON.stringify(items));
    } catch (err) {
      console.warn("No se pudo guardar el carrito:", err);
    }
  }, []);

  const emitChanged = useCallback((items) => {
    try {
      window.dispatchEvent(new CustomEvent("cart:changed", { detail: { cart: items } }));
    } catch {/* noop */}
  }, []);

  const emitAdded = useCallback((amount = 1) => {
    try {
      window.dispatchEvent(new CustomEvent("cart:add", { detail: { amount } }));
      window.dispatchEvent(new CustomEvent("minicart:open"));
    } catch {/* noop */}
  }, []);

  /* ==== Carga desde localStorage y sincroniza canónico ==== */
  const loadCart = useCallback(
    (key) => {
      try {
        const raw = localStorage.getItem(cartKeyFor(key));
        const parsed = raw ? JSON.parse(raw) : [];
        const items = Array.isArray(parsed) ? parsed : [];
        setCartItems(items);
        // Espeja inmediatamente al canónico y emite cambio
        persist(key, items);
        emitChanged(items);
      } catch {
        setCartItems([]);
        persist(key, []);
        emitChanged([]);
      }
    },
    [persist, emitChanged]
  );

  /* ==== Totales with offers ==== */
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
          acc + Number(it.regular_price ?? it.price ?? 0) * Number(it.quantity || 1),
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
      name: p.name ?? p.nombre ?? "",
      price: pr.price,
      offer_price: pr.offer_price,
      regular_price: pr.regular_price,
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

  /* ==== Commit centralizado: setState + persist + evento ==== */
  const commit = useCallback(
    (next, opts = {}) => {
      setCartItems(next);
      persist(userKey, next);
      emitChanged(next);
      if (opts.addedQty && opts.addedQty > 0) emitAdded(opts.addedQty);
    },
    [userKey, persist, emitChanged, emitAdded]
  );

  /* ==== Acciones ==== */
  const addToCart = (producto) => {
    const item = normalizeItem(producto);
    let added = 0;

    const next = (function buildNext(prev) {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (item.stock_actual != null && item.stock_actual <= 0) {
        toast.warn("😢 Producto sin stock disponible");
        return prev;
      }
      if (idx === -1) {
        const qty = Math.max(1, item.quantity || 1);
        const finalQty = item.stock_actual != null ? Math.min(qty, item.stock_actual) : qty;
        added = finalQty;
        return [...prev, { ...item, quantity: finalQty }];
      }
      const copy = [...prev];
      const current = copy[idx];
      const refreshed = normalizeItem({ ...current, ...producto });
      const nextQty = Number(current.quantity || 1) + Number(item.quantity || 1);
      if (current.stock_actual != null && nextQty > current.stock_actual) {
        toast.warn(`😢 Stock máximo alcanzado: ${current.stock_actual}`);
        added = Math.max(0, current.stock_actual - Number(current.quantity || 1));
        copy[idx] = { ...refreshed, quantity: current.stock_actual };
      } else {
        added = Number(item.quantity || 1);
        copy[idx] = { ...refreshed, quantity: nextQty };
      }
      return copy;
    })(cartItems);

    if (next !== cartItems) commit(next, { addedQty: added });
  };

  const removeFromCart = (id) => {
    const next = cartItems.filter((it) => it.id !== id);
    commit(next);
  };

// usa el commit centralizado para que también persista y emita eventos
const clearCart = useCallback(() => {
  commit([]);                 // <- vacía, persiste en localStorage y emite "cart:changed"
}, [commit]);

  const increaseQuantity = (id) => {
    const next = cartItems.map((it) => {
      if (it.id !== id) return it;
      const q = Number(it.quantity || 1) + 1;
      if (it.stock_actual != null && q > it.stock_actual) {
        toast.warn(`😢 Stock máximo alcanzado: ${it.stock_actual}`);
        return { ...it, quantity: it.stock_actual };
      }
      return { ...it, quantity: q };
    });
    commit(next);
  };

  const decreaseQuantity = (id) => {
    const next = cartItems.map((it) =>
      it.id === id ? { ...it, quantity: Math.max(1, Number(it.quantity || 1) - 1) } : it
    );
    commit(next);
  };

  const setQuantity = (id, qty) => {
    const q = Math.max(1, Number(qty || 1));
    const next = cartItems.map((it) => {
      if (it.id !== id) return it;
      if (it.stock_actual != null && q > it.stock_actual) {
        toast.warn(`😢 Stock máximo alcanzado: ${it.stock_actual}`);
        return { ...it, quantity: it.stock_actual };
      }
      return { ...it, quantity: q };
    });
    commit(next);
  };

  const updateQuantity = (id, tipo) => {
    if (tipo === "increment") increaseQuantity(id);
    if (tipo === "decrement") decreaseQuantity(id);
  };

  /* ==== Carga inicial ==== */
  useEffect(() => {
    loadCart(userKey);
  }, [userKey, loadCart]);

  /* ==== Reaccionar a cambios de sesión y storage ==== */
  useEffect(() => {
    const onAuthChanged = () => {
      const newKey = getUserKey();
      const prevKey = prevUserKeyRef.current;

      // LOGOUT -> limpiar guest
      if (prevKey !== "guest" && newKey === "guest") {
        try {
          localStorage.setItem(cartKeyFor("guest"), JSON.stringify([]));
        } catch (err) {
          console.warn("Error limpiando carrito guest:", err);
        }
        setUserKey("guest");
        prevUserKeyRef.current = "guest";
        // sincroniza canónico y evento
        persist("guest", []);
        emitChanged([]);
        setCartItems([]);
        return;
      }

      // LOGIN -> fusionar guest con user
      if (prevKey === "guest" && newKey !== "guest") {
        let guest = [];
        let user = [];
        try {
          const rg = localStorage.getItem(cartKeyFor("guest"));
          guest = rg ? JSON.parse(rg) : [];
        } catch {/* noop */}
        try {
          const ru = localStorage.getItem(cartKeyFor(newKey));
          user = ru ? JSON.parse(ru) : [];
        } catch {/* noop */}

        const merged = mergeCartItems(guest, user);
        try {
          localStorage.setItem(cartKeyFor(newKey), JSON.stringify(merged));
          localStorage.removeItem(cartKeyFor("guest"));
        } catch {/* noop */}

        setUserKey(newKey);
        prevUserKeyRef.current = newKey;
        setCartItems(merged);
        persist(newKey, merged);
        emitChanged(merged);
        return;
      }

      // Otro cambio de identidad
      setUserKey(newKey);
      prevUserKeyRef.current = newKey;
      loadCart(newKey);
    };

    const onCartClear = () => clearCart();

    const onStorage = (e) => {
      if (
        e.key === "usuario_id" ||
        e.key === "usuario_email" ||
        e.key === "email" ||
        e.key === "usuario_nombre" ||
        e.key === "usuario_rol" ||
        e.key === "usuario_is_admin"
      ) {
        onAuthChanged();
      }
      if (e.key === cartKeyFor(userKey)) {
        loadCart(userKey);
      }
    };

    window.addEventListener("auth:changed", onAuthChanged);
    window.addEventListener("cart:clear", onCartClear);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth:changed", onAuthChanged);
      window.removeEventListener("cart:clear", onCartClear);
      window.removeEventListener("storage", onStorage);
    };
  }, [userKey, loadCart, persist, emitChanged, clearCart]);

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

        // Totales
        total: subtotal,
        subtotal,
        regularSubtotal,
        savingsTotal,
        savingsPct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
