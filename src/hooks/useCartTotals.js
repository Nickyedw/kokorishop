// src/hooks/useCartTotals.js
import { useEffect, useState, useCallback } from "react";

export default function useCartTotals(storageKey = "cart") {
  const [totals, setTotals] = useState({ count: 0, subtotal: 0 });

  const recalc = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      let items = [];

      if (raw) {
        const parsed = JSON.parse(raw);
        // soporta formatos: array directo o { items: [...] }
        items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
      }

      const count = items.reduce((a, it) => a + Number(it?.quantity || 0), 0);
      const subtotal = items.reduce(
        (a, it) => a + Number(it?.price ?? it?.offer_price ?? 0) * Number(it?.quantity || 0),
        0
      );

      setTotals({ count, subtotal });
    } catch {
      setTotals({ count: 0, subtotal: 0 });
    }
  }, [storageKey]);

  useEffect(() => {
    recalc(); // al montar

    const onChanged = () => recalc();
    window.addEventListener("cart:changed", onChanged);
    window.addEventListener("cart:add", onChanged);
    window.addEventListener("storage", onChanged); // cambios desde otras pestañas

    return () => {
      window.removeEventListener("cart:changed", onChanged);
      window.removeEventListener("cart:add", onChanged);
      window.removeEventListener("storage", onChanged);
    };
  }, [recalc]);

  return totals; // { count, subtotal }
}
