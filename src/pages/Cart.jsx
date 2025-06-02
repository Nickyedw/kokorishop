import React, { useContext } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-purple-50 text-purple-800 p-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <FaShoppingBag className="text-purple-500" /> Tu Carrito
      </h1>

      {cartItems.length === 0 ? (
        <p className="text-center">Tu carrito está vacío 🛒</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl text-center shadow-md">
                <div className="text-4xl mb-2">{item.emoji}</div>
                <p className="font-semibold">{item.name}</p>
                <p>Cantidad: {item.quantity}</p>
                <p className="font-bold">${item.price * item.quantity}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="mt-2 bg-red-500 text-white px-4 py-1 rounded-full text-sm hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right space-x-2">
            <span className="font-bold text-xl">Total: ${total}</span>
            <button onClick={clearCart} className="bg-gray-400 text-white px-4 py-2 rounded-full hover:bg-gray-500">
              Vaciar Carrito
            </button>
            <button className="bg-purple-500 text-white px-6 py-2 rounded-full hover:bg-purple-600">
              Proceder al Pago
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;

