// src/pages/Cart.jsx
import React, { useContext, useState } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { crearPedido } from '../services/pedidoService';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState(false);

  const navigate = useNavigate();

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleConfirmarPedido = async () => {
    setEnviando(true);
    try {
      const pedido = {
        usuario_id: 6,
        metodo_pago_id: 1,
        metodo_entrega_id: 1,
        zona_entrega_id: 1,
        horario_entrega_id: 1,
        productos: cartItems.map(item => ({
          producto_id: item.id,
          cantidad: item.quantity,
          precio_unitario: item.price
        }))
      };
      await crearPedido(pedido);
      clearCart();
      setMostrarResumen(false);
      setPedidoExitoso(true);
    } catch (err) {
      console.error('Error al enviar pedido:', err);
      alert('❌ Error al enviar pedido');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 text-purple-800 p-6 relative">
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
            <button
              onClick={() => setMostrarResumen(true)}
              className="bg-purple-500 text-white px-6 py-2 rounded-full hover:bg-purple-600"
            >
              Proceder al Pago
            </button>
          </div>
        </>
      )}

      {/* Modal de resumen */}
      {mostrarResumen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">Resumen de Pedido</h2>
            <ul className="mb-4">
              {cartItems.map(item => (
                <li key={item.id} className="flex justify-between mb-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="font-bold text-right mb-4">Total: ${total.toFixed(2)}</div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarResumen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPedido}
                disabled={enviando}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {enviando ? 'Enviando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {pedidoExitoso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-green-600 mb-4">✅ Pedido Enviado</h3>
            <p className="mb-4 text-purple-700">Tu pedido fue enviado correctamente.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/menu')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Volver al Menú
              </button>
              <button
                onClick={() => navigate('/mis-pedidos')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Ver Pedidos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
