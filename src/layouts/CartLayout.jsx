// src/layouts/CartLayout.jsx
import React from "react";
import CartFab from "../components/CartFab";
import MiniCart from "../components/MiniCart";

export default function CartLayout({ children }) {
  const openMini = () => {
    window.dispatchEvent(new CustomEvent("minicart:open"));
  };

  return (
    <>
      {children}
      {/* Botón flotante (arrastrable) */}
      <CartFab onOpenCart={openMini} />

      {/* Barra breve que aparece cuando se abre el mini-cart */}
      <MiniCart cartPath="/Cart" />
    </>
  );
}
