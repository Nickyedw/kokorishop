import React from 'react';
import { FaShoppingBag } from 'react-icons/fa';

const Cart = () => {
  const carrito = [
    { name: 'Almohada Gatito', emoji: '🐱', price: '$18' },
    { name: 'Termo Conejo', emoji: '🐰', price: '$14' },
  ];

  return (
    <div className="min-h-screen bg-purple-50 text-purple-800 p-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <FaShoppingBag className="text-purple-500" /> Tu Carrito
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {carrito.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-xl text-center shadow-md">
            <div className="text-4xl mb-2">{item.emoji}</div>
            <p className="font-semibold">{item.name}</p>
            <p className="font-bold">{item.price}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 text-right">
        <button className="bg-purple-500 text-white px-6 py-2 rounded-full hover:bg-purple-600">
          Proceder al Pago
        </button>
      </div>
    </div>
  );
};

export default Cart;
