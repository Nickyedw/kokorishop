// src/layouts/CartLayout.jsx
import MiniCart from "../components/MiniCart";
import CartFab from "../components/CartFab";
import useCartTotals from "../hooks/useCartTotals";

export default function CartLayout({ children }) {
  // Si tu key de localStorage no es "cart", cámbiala aquí
  const { count, subtotal } = useCartTotals("cart");

  const openCart = () => {
    window.dispatchEvent(new Event("cart:open"));
  };

  return (
    <>
      {children}
      <MiniCart />
      <CartFab count={count} subtotal={subtotal} onOpenCart={openCart} />
    </>
  );
}
