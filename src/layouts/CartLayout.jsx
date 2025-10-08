// src/layouts/CartLayout.jsx
import React from "react";
import CartFab from "../components/CartFab";
import CartQuickView from "../components/CartQuickView";

export default function CartLayout({ children }) {
  return (
    <>
      {children}
      <CartQuickView />
      <CartFab />
    </>
  );
}
