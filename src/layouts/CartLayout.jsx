// src/layouts/CartLayout.jsx
import React from "react";
import CartFab from "../components/CartFab";
import CartQuickView from "../components/CartQuickView";
import WhatsAppFab from "../components/WhatsAppFab";

export default function CartLayout({ children, hideWhatsapp = false }) {
  const openMini = () => {
    window.dispatchEvent(new CustomEvent("cart:quick:open"));
  };

  return (
    <>
      {children}

      {/* Botón flotante del carrito */}
      <CartFab onOpenCart={openMini} />

      {/* Mini carrito */}
      <CartQuickView />

      {/* WhatsApp oculto si el Coming Soon está activo */}
      {!hideWhatsapp && <WhatsAppFab />}
    </>
  );
}
