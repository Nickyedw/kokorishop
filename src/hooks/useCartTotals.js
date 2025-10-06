// src/hooks/useCartTotals.js
import { useCallback, useEffect, useState } from "react";

export default function useCartTotals(storageKey = "cart") {
  const [totals, setTotals] = useState({ count: 0, subtotal: 0 });

  const recalc = useCallback(() => {
    try {
      const items = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const subtotal = items.reduce((acc, it) => acc + Number(it.price || it.precio || 0) * Number(it.quantity || 0), 0);
      const count = items.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
      setTotals({ count, subtotal });
    } catch {
      setTotals({ count: 0, subtotal: 0 });
    }
  }, [storageKey]);

  useEffect(() => {
    recalc(); // al montar
    const onChanged = () => recalc();
    window.addEventListener("cart:changed", onChanged);
    return () => window.removeEventListener("cart:changed", onChanged);
  }, [recalc]);

  return totals; // { count, subtotal }
}
