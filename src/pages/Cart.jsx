// src/pages/Cart.jsx
import React, { useContext, useEffect, useState } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { crearPedido } from '../services/pedidoService';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// 🔗 Base del backend para servir imágenes
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// 🖼️ Helper: devuelve una URL usable por <img />
function getImageSrc(item) {
  const raw =
    item.imagen_url || item.image || item.imagen || item.foto || item.url_imagen;

  if (!raw) return null;

  // Si ya es absoluta (http/https), úsala tal cual
  if (/^https?:\/\//i.test(raw)) return raw;

  // Si viene con slash inicial, prefix con el backend (ej. "/uploads/archivo.jpg")
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;

  // Si viene solo el nombre de archivo, asume carpeta /uploads del backend
  return `${API_BASE}/uploads/${raw}`;
}

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

  const { search } = useLocation();

  React.useEffect(() => {
    const qp = new URLSearchParams(search);
    if (qp.get('checkout') === '1') {
      // Abre tu modal al llegar desde favoritos
      setMostrarResumen(true);
    }
  }, [search]);

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
          {/* Layout principal: lista + resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LISTA DE PRODUCTOS */}
            <section className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <article
                  key={item.id}
                  className="group bg-white rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex items-stretch gap-4 p-4 sm:p-5">
                    {/* Miniatura */}
                    <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-purple-50 border border-purple-100 grid place-items-center">
                      {getImageSrc(item) ? (
                        <img
                          src={getImageSrc(item)}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                        />
                      ) : (
                        <span className="text-3xl">{item.emoji || "🛍️"}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-purple-900 text-base sm:text-lg line-clamp-2">
                          {item.name}
                        </h3>

                        {/* Eliminar */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500/80 hover:text-red-600 text-sm flex items-center gap-1"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h.293l.853 10.236A2 2 0 007.14 18h5.72a2 2 0 001.994-1.764L15.707 6H16a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0010 2H9zM8 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </div>

                      {/* Precio unitario */}
                      <div className="text-purple-700 mt-1 text-sm">
                        Precio:{" "}
                        <span className="font-semibold">
                          S/ {Number(item.price).toFixed(2)}
                        </span>
                      </div>

                      {/* Controles */}
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {/* Stepper */}
                        <div className="inline-flex items-center rounded-full border border-purple-200 overflow-hidden">
                          <button
                            onClick={() => decreaseQuantity(item.id)}
                            className="px-3 py-1.5 text-purple-700 hover:bg-purple-50 disabled:opacity-40"
                            disabled={Number(item.quantity) <= 1}
                          >
                            –
                          </button>
                          <span className="px-3 py-1.5 text-sm font-semibold min-w-[2ch] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              const stock = Number(item.stock_actual) || 0;
                              if (item.quantity < stock) {
                                increaseQuantity(item.id);
                              } else {
                                toast.warning(`😵‍💫 Solo hay ${stock} unidades disponibles`);
                              }
                            }}
                            className="px-3 py-1.5 text-purple-700 hover:bg-purple-50"
                          >
                            +
                          </button>
                        </div>

                        {/* Total por ítem */}
                        <div className="ml-auto text-sm sm:text-base">
                          <span className="text-gray-500 mr-1">Total:</span>
                          <span className="font-bold text-purple-900">
                            S/ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* Acciones inferiores */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={clearCart}
                  className="rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-700 px-4 py-2 text-sm font-medium transition"
                >
                  Vaciar carrito
                </button>
                <div className="text-right">
                  <div className="text-gray-600 text-sm">Subtotal</div>
                  <div className="text-2xl font-bold text-purple-900">
                    S/ {total.toFixed(2)}
                  </div>
                </div>
              </div>
            </section>

            {/* RESUMEN STICKY */}
            <aside className="lg:sticky lg:top-6 h-max">
              <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
                <h2 className="text-lg font-semibold text-purple-900">Resumen del pedido</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">S/ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium">A definir</span>
                  </div>
                  <div className="border-t border-purple-100 my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-purple-800">Total</span>
                    <span className="font-extrabold text-purple-900">
                      S/ {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMostrarResumen(true)}
                  className="w-full mt-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-3 font-semibold shadow hover:shadow-lg active:scale-[0.99] transition"
                >
                  Proceder al pago
                </button>

                <p className="text-[12px] text-gray-500 mt-3">
                  Al continuar, aceptas nuestras políticas de compra y privacidad.
                </p>
              </div>
            </aside>
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
                    <span> S/ {(item.price * item.quantity).toFixed(2)}</span>
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
                Total: S/{total.toFixed(2)}
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
