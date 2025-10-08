// src/layouts/CartLayout.jsx
import React from "react";
import CartFab from "../components/CartFab";
import CartQuickView from "../components/CartQuickView";

export default function CartLayout({ children }) {
  const openMini = () => {
    window.dispatchEvent(new CustomEvent("cart:quick:open"));
  };

  return (
    <>
      {children}
      <CartFab onOpenCart={openMini} />
      <CartQuickView />
    </>
  );
}
