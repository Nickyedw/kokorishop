// src/pages/Cart.jsx
import React, { useContext, useEffect, useState } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { crearPedido } from '../services/pedidoService';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
  } = useContext(CartContext);

  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState(false);
  const [errorStock, setErrorStock] = useState('');
  const navigate = useNavigate();
  const [usuarioNombre, setUsuarioNombre] = useState('Invitado');

  const [metodosPago, setMetodosPago] = useState([]);
  const [zonasEntrega, setZonasEntrega] = useState([]);
  const [horariosEntrega, setHorariosEntrega] = useState([]);
  const [metodosEntrega, setMetodosEntrega] = useState([]);

  const [seleccion, setSeleccion] = useState({
    metodo_pago_id: '',
    zona_entrega_id: '',
    horario_entrega_id: '',
    metodo_entrega_id: '',
  });

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  useEffect(() => {
    const nombre = localStorage.getItem('usuario_nombre') || 'Invitado';
    setUsuarioNombre(nombre);
    cargarOpciones();
  }, []);

  const cargarOpciones = async () => {
    const endpoints = [
      ['metodos_pago', setMetodosPago],
      ['zonas_entrega', setZonasEntrega],
      ['horarios_entrega', setHorariosEntrega],
      ['metodos_entrega', setMetodosEntrega],
    ];

    for (let [endpoint, setter] of endpoints) {
      try {
        const res = await fetch(`http://localhost:3001/api/${endpoint}`);
        const data = await res.json();
        setter(data);
      } catch (error) {
        console.error(`❌ Error cargando ${endpoint}:`, error);
      }
    }
  };

const obtenerComentarioPago = () => {
  const metodo = metodosPago.find((m) => m.id === parseInt(seleccion.metodo_pago_id));

  if (!metodo) return '';

  switch (metodo.nombre.toLowerCase()) {
    case 'transferencia bancaria':
      return 'Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.';
    case 'yape':
      return 'Realiza el pago por Yape al número 987654321 o escanea el QR.';
    case 'plin':
      return 'Realiza el pago por Plin al número 987654321 o escanea el QR.';
    case 'efectivo al momento de entrega':
      return seleccion.comentario_pago || 'El cliente pagará en efectivo al momento de entrega.';
    default:
      return '';
  }
};

const handleConfirmarPedido = async () => {
  setEnviando(true);
  try {
    const pedido = {
      usuario_id: localStorage.getItem('usuario_id'),
      metodo_pago_id: seleccion.metodo_pago_id,
      metodo_entrega_id: seleccion.metodo_entrega_id,
      zona_entrega_id: seleccion.zona_entrega_id,
      horario_entrega_id: seleccion.horario_entrega_id,
      comentario_pago: obtenerComentarioPago(), // ✅ correcto aquí
      productos: cartItems.map((item) => ({
        producto_id: item.id,
        cantidad: item.quantity,
        precio_unitario: item.price,
      })),
    };

      await crearPedido(pedido);
      clearCart();
      setMostrarResumen(false);
      setPedidoExitoso(true);
    } catch (err) {
      console.error('Error al enviar pedido:', err);
      if (err.message?.toLowerCase().includes('stock insuficiente')) {
        setErrorStock(err.message);
        toast.warn(`😢 ${err.message}`);
      } else {
        toast.error('❌ Error al enviar pedido');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 text-purple-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FaShoppingBag className="text-purple-500" /> Hola, {usuarioNombre}
        </h1>
        <Link
          to="/"
          className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded-full text-sm"
        >
          ← Volver a la tienda
        </Link>
      </div>

      {errorStock && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
          ⚠️ {errorStock}
        </div>
      )}

      {cartItems.length === 0 ? (
        <p className="text-center">Tu carrito está vacío 🛒</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl text-center shadow-md"
              >
                <div className="text-4xl mb-2">{item.emoji}</div>
                <p className="font-semibold">{item.name}</p>
                <div className="flex justify-center items-center gap-2 mt-1">
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="px-2 bg-gray-300 rounded"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => {
                      const stock = Number(item.stock_actual) || 0;
                      if (item.quantity < stock) {
                        increaseQuantity(item.id);
                      } else {
                        toast.warning(`😵‍💫 Solo hay ${stock} unidades disponibles`);
                      }
                    }}
                    className="bg-purple-500 text-white px-2"
                  >
                    +
                  </button>
                </div>
                <p className="font-bold mt-2">
                  ${item.price * item.quantity}
                </p>
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
            <span className="font-bold text-xl">
              Total: ${total.toFixed(2)}
            </span>
            <button
              onClick={clearCart}
              className="bg-gray-400 text-white px-4 py-2 rounded-full hover:bg-gray-500"
            >
              Vaciar Carrito
            </button>
            <button
              onClick={() => setMostrarResumen(true)}
              className="bg-purple-500 text-white px-6 py-2 rounded-full hover:bg-purple-600"
            >
              Proceder al Pago
            </button>
          </div>

          {mostrarResumen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4 text-purple-800">
                Resumen de Pedido
              </h2>

              <ul className="mb-4">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between mb-2">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {/* Método de Pago */}
              <div className="mb-4">
                <label>Método de Pago:</label>
                <select
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={seleccion.metodo_pago_id}
                  onChange={(e) =>
                    setSeleccion((prev) => ({
                      ...prev,
                      metodo_pago_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Seleccione</option>
                  {metodosPago.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instrucciones y QR del método de pago */}
              {seleccion.metodo_pago_id && (
                <div className="bg-yellow-50 border border-yellow-300 p-4 mb-4 rounded text-sm text-yellow-800">
                  <h3 className="font-bold mb-2">Instrucciones de pago:</h3>
                  <p>
                    {
                      metodosPago.find(m => m.id === parseInt(seleccion.metodo_pago_id))?.instrucciones
                    }
                  </p>

                  {metodosPago.find(m => m.id === parseInt(seleccion.metodo_pago_id))?.qr_url && (
                    <img
                      src={metodosPago.find(m => m.id === parseInt(seleccion.metodo_pago_id))?.qr_url}
                      alt="QR"
                      className="mt-3 mx-auto max-w-xs"
                    />
                  )}

                  {metodosPago.find(m => m.nombre.toLowerCase().includes('efectivo'))?.id === parseInt(seleccion.metodo_pago_id) && (
                    <div className="mt-4">
                      <label className="block text-sm mb-1">¿Necesitas vuelto?</label>
                      <input
                        type="text"
                        placeholder="Ej: llevaré S/100"
                        className="w-full border px-2 py-1 rounded"
                        onChange={(e) =>
                          setSeleccion(prev => ({ ...prev, comentario_pago: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Zona de Entrega */}
              <div className="mb-4">
                <label>Zona de Entrega:</label>
                <select
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={seleccion.zona_entrega_id}
                  onChange={(e) =>
                    setSeleccion((prev) => ({
                      ...prev,
                      zona_entrega_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Seleccione</option>
                  {zonasEntrega.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nombre_zona}
                    </option>
                  ))}
                </select>
              </div>

              {/* Horario de Entrega */}
              <div className="mb-4">
                <label>Horario de Entrega:</label>
                <select
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={seleccion.horario_entrega_id}
                  onChange={(e) =>
                    setSeleccion((prev) => ({
                      ...prev,
                      horario_entrega_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Seleccione</option>
                  {horariosEntrega.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Método de Entrega */}
              <div className="mb-4">
                <label>Método de Entrega:</label>
                <select
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={seleccion.metodo_entrega_id}
                  onChange={(e) =>
                    setSeleccion((prev) => ({
                      ...prev,
                      metodo_entrega_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Seleccione</option>
                  {metodosEntrega.map((me) => (
                    <option key={me.id} value={me.id}>
                      {me.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="font-bold text-right mb-4">
                Total: ${total.toFixed(2)}
              </div>
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
           </>
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
