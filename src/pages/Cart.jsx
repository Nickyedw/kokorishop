// src/pages/Cart.jsx
import React, { useContext, useEffect, useState } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import { crearPedido } from "../services/pedidoService";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// 🔗 Base del backend para imágenes
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// 🖼️ Helper para construir URL de imagen
function getImageSrc(item) {
  const raw =
    item?.imagen_url || item?.image || item?.imagen || item?.foto || item?.url_imagen;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  return `${API_BASE}/uploads/${raw}`;
}

export default function Cart() {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,

    // NUEVO: totales “oferta-aware”
    subtotal,          // usa price (oferta si la hay)
    regularSubtotal,   // usa regular_price (antes)
    savingsTotal,      // ahorro total
    savingsPct,        // % ahorro global
    total,             // alias a subtotal (compat)
  } = useContext(CartContext);

  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState(false);
  const [errorStock, setErrorStock] = useState("");

  const navigate = useNavigate();
  const { search } = useLocation();

  const [usuarioNombre, setUsuarioNombre] = useState("Invitado");

  const [metodosPago, setMetodosPago] = useState([]);
  const [zonasEntrega, setZonasEntrega] = useState([]);
  const [horariosEntrega, setHorariosEntrega] = useState([]);
  const [metodosEntrega, setMetodosEntrega] = useState([]);

  const [seleccion, setSeleccion] = useState({
    metodo_pago_id: "",
    zona_entrega_id: "",
    horario_entrega_id: "",
    metodo_entrega_id: "",
    comentario_pago: "",
  });

  useEffect(() => {
    const nombre = localStorage.getItem("usuario_nombre") || "Invitado";
    setUsuarioNombre(nombre);
    cargarOpciones();
  }, []);

  useEffect(() => {
    const qp = new URLSearchParams(search);
    if (qp.get("checkout") === "1") setMostrarResumen(true);
  }, [search]);

  async function cargarOpciones() {
    const endpoints = [
      ["metodos_pago", setMetodosPago],
      ["zonas_entrega", setZonasEntrega],
      ["horarios_entrega", setHorariosEntrega],
      ["metodos_entrega", setMetodosEntrega],
    ];
    for (const [endpoint, setter] of endpoints) {
      try {
        const res = await fetch(`${API_BASE}/api/${endpoint}`);
        const data = await res.json();
        setter(data);
      } catch (err) {
        console.error(`❌ Error cargando ${endpoint}:`, err);
      }
    }
  }

  function obtenerComentarioPago() {
    const metodo = metodosPago.find((m) => m.id === parseInt(seleccion.metodo_pago_id));
    if (!metodo) return "";
    switch (metodo.nombre.toLowerCase()) {
      case "transferencia bancaria":
        return "Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.";
      case "yape":
        return "Realiza el pago por Yape al número 987654321 o escanea el QR.";
      case "plin":
        return "Realiza el pago por Plin al número 987654321 o escanea el QR.";
      case "efectivo al momento de entrega":
        return seleccion.comentario_pago || "El cliente pagará en efectivo al momento de entrega.";
      default:
        return "";
    }
  }

  async function handleConfirmarPedido() {
    setEnviando(true);
    try {
      const pedido = {
        usuario_id: localStorage.getItem("usuario_id"),
        metodo_pago_id: seleccion.metodo_pago_id,
        metodo_entrega_id: seleccion.metodo_entrega_id,
        zona_entrega_id: seleccion.zona_entrega_id,
        horario_entrega_id: seleccion.horario_entrega_id,
        comentario_pago: obtenerComentarioPago(),
        productos: cartItems.map((i) => ({
          producto_id: i.id,
          cantidad: i.quantity,
          precio_unitario: i.price, // ya es “oferta” si existe
        })),
      };

      await crearPedido(pedido);
      clearCart();
      setMostrarResumen(false);
      setPedidoExitoso(true);
    } catch (err) {
      console.error("Error al enviar pedido:", err);
      if (err?.message?.toLowerCase?.().includes("stock insuficiente")) {
        setErrorStock(err.message);
        toast.warn(`😢 ${err.message}`);
      } else {
        toast.error("❌ Error al enviar pedido");
      }
    } finally {
      setEnviando(false);
    }
  }

  const formatSoles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-purple-50 text-purple-800">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-purple-50/80 backdrop-blur border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-lg sm:text-xl font-extrabold text-purple-900">
            <FaShoppingBag className="text-purple-600" />
            <span className="hidden sm:inline">Hola,</span> {usuarioNombre}
          </h1>
          <Link
            to="/"
            className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 text-xs sm:text-sm font-medium transition"
          >
            ← Volver a la tienda
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-28 pt-4 sm:pt-6">
        {!!errorStock && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
            ⚠️ {errorStock}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="min-h-[50vh] grid place-items-center text-center">
            <div>
              <div className="text-5xl mb-2">🛒</div>
              <h2 className="text-xl font-semibold text-purple-900">Tu carrito está vacío</h2>
              <p className="text-purple-600 mt-1">Agrega productos para continuar.</p>
              <Link
                to="/"
                className="inline-block mt-5 rounded-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 font-semibold"
              >
                Ver productos
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Layout principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LISTA */}
              <section className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const img = getImageSrc(item);
                  const stock = Number(item.stock_actual) || 0;
                  const canInc = Number(item.quantity) < stock;
                  const isOffer =
                    !!item.en_oferta &&
                    Number(item.regular_price ?? 0) > Number(item.price ?? 0);
                  const pct =
                    isOffer
                      ? Math.round(
                          ((Number(item.regular_price) - Number(item.price)) /
                            Number(item.regular_price)) *
                            100
                        )
                      : 0;

                  return (
                    <article
                      key={item.id}
                      className="bg-white rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition overflow-hidden"
                    >
                      {/* Card responsive: imagen + contenido */}
                      <div className="grid grid-cols-[96px_1fr] sm:grid-cols-[112px_1fr] gap-4 p-4 sm:p-5">
                        {/* Miniatura */}
                        <div className="relative w-24 h-24 sm:w-[112px] sm:h-[112px] rounded-xl overflow-hidden bg-purple-50 border border-purple-100">
                          {img ? (
                            <img
                              src={img}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-cover object-center"
                              loading="lazy"
                              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-3xl">
                              {item.emoji || "🛍️"}
                            </div>
                          )}

                          {/* Etiqueta -% si está en oferta */}
                          {isOffer && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow">
                              -{pct}%
                            </span>
                          )}
                        </div>

                        {/* Info + acciones */}
                        <div className="min-w-0">
                          {/* Título + eliminar */}
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-purple-900 text-base sm:text-lg leading-snug line-clamp-2">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500/80 hover:text-red-600 text-sm font-medium"
                              aria-label={`Eliminar ${item.name}`}
                            >
                              Eliminar
                            </button>
                          </div>

                          {/* Precio unitario (con oferta) */}
                          <div className="text-purple-700 mt-1 text-sm flex items-baseline gap-2">
                            <span>Precio:</span>
                            {isOffer ? (
                              <>
                                <span className="text-gray-500 line-through">
                                  {formatSoles(item.regular_price)}
                                </span>
                                <span className="font-semibold">
                                  {formatSoles(item.price)}
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold">
                                {formatSoles(item.price)}
                              </span>
                            )}
                          </div>

                          {/* Controles */}
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            {/* Stepper */}
                            <div className="inline-flex items-center rounded-full border border-purple-200 overflow-hidden">
                              <button
                                onClick={() => decreaseQuantity(item.id)}
                                className="px-3 py-1.5 text-purple-700 hover:bg-purple-50 disabled:opacity-40"
                                disabled={Number(item.quantity) <= 1}
                                aria-label="Disminuir"
                              >
                                –
                              </button>
                              <span className="px-3 py-1.5 text-sm font-semibold min-w-[2ch] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  if (canInc) {
                                    increaseQuantity(item.id);
                                  } else {
                                    toast.warning(`😵‍💫 Solo hay ${stock} unidades disponibles`);
                                  }
                                }}
                                className="px-3 py-1.5 text-purple-700 hover:bg-purple-50"
                                aria-label="Aumentar"
                              >
                                +
                              </button>
                            </div>

                            {/* Total por ítem */}
                            <div className="ml-auto text-sm sm:text-base">
                              <span className="text-gray-500 mr-1">Total:</span>
                              <span className="font-bold text-purple-900">
                                {formatSoles(Number(item.price) * Number(item.quantity))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

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
                      {formatSoles(subtotal ?? total)}
                    </div>
                  </div>
                </div>
              </section>

              {/* RESUMEN (sticky en desktop) */}
              <aside className="lg:sticky lg:top-6 h-max">
                <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
                  <h2 className="text-lg font-semibold text-purple-900">Resumen del pedido</h2>

                  <div className="mt-4 space-y-2 text-sm">
                    {/* Antes (si hay diferencia) */}
                    {regularSubtotal > subtotal && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Antes</span>
                        <span className="text-gray-500 line-through">
                          {formatSoles(regularSubtotal)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatSoles(subtotal)}</span>
                    </div>

                    {/* Ahorro */}
                    {regularSubtotal > subtotal && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Ahorras</span>
                        <span>
                          {formatSoles(savingsTotal)} ({savingsPct}%)
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío</span>
                      <span className="font-medium">A definir</span>
                    </div>

                    <div className="border-t border-purple-100 my-2" />

                    <div className="flex justify-between text-base">
                      <span className="font-semibold text-purple-800">Total</span>
                      <span className="font-extrabold text-purple-900">
                        {formatSoles(subtotal)}
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

            {/* Barra fija inferior (móvil) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur bg-white/80 border-t border-purple-200">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-600">Subtotal</div>
                  <div className="text-lg font-extrabold text-purple-900">
                    {formatSoles(subtotal)}
                  </div>
                </div>
                <button
                  onClick={() => setMostrarResumen(true)}
                  className="flex-1 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-3 font-semibold shadow hover:shadow-lg active:scale-[0.99] transition text-center"
                >
                  Proceder al pago
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal: Checkout */}
      {mostrarResumen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-3">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="text-xl font-semibold text-purple-800">Resumen de Pedido</h2>
            </div>

            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-auto">
              <ul className="space-y-2 text-sm">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="truncate pr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatSoles(Number(item.price) * Number(item.quantity))}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Campos en grid desde md */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Método de Pago */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-purple-800">Método de pago</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={seleccion.metodo_pago_id}
                    onChange={(e) =>
                      setSeleccion((prev) => ({ ...prev, metodo_pago_id: e.target.value }))
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

                {/* Instrucciones y QR */}
                {seleccion.metodo_pago_id && (
                  <div className="md:col-span-2 bg-yellow-50 border border-yellow-300 p-3 rounded text-xs text-yellow-800">
                    <div className="font-semibold mb-1">Instrucciones de pago</div>
                    <p className="leading-relaxed">
                      {metodosPago.find((m) => m.id === parseInt(seleccion.metodo_pago_id))?.instrucciones}
                    </p>

                    {metodosPago.find((m) => m.id === parseInt(seleccion.metodo_pago_id))?.qr_url && (
                      <img
                        src={metodosPago.find((m) => m.id === parseInt(seleccion.metodo_pago_id))?.qr_url}
                        alt="QR"
                        className="mt-3 mx-auto max-w-[220px]"
                      />
                    )}

                    {metodosPago.find((m) => m.nombre.toLowerCase().includes("efectivo"))?.id ===
                      parseInt(seleccion.metodo_pago_id) && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium">¿Necesitas vuelto?</label>
                        <input
                          type="text"
                          placeholder="Ej: llevaré S/100"
                          className="w-full border px-3 py-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-purple-300"
                          onChange={(e) =>
                            setSeleccion((prev) => ({ ...prev, comentario_pago: e.target.value }))
                          }
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Zona */}
                <div>
                  <label className="text-sm font-medium text-purple-800">Zona de entrega</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={seleccion.zona_entrega_id}
                    onChange={(e) =>
                      setSeleccion((prev) => ({ ...prev, zona_entrega_id: e.target.value }))
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

                {/* Horario */}
                <div>
                  <label className="text-sm font-medium text-purple-800">Horario de entrega</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={seleccion.horario_entrega_id}
                    onChange={(e) =>
                      setSeleccion((prev) => ({ ...prev, horario_entrega_id: e.target.value }))
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
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-purple-800">Método de entrega</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={seleccion.metodo_entrega_id}
                    onChange={(e) =>
                      setSeleccion((prev) => ({ ...prev, metodo_entrega_id: e.target.value }))
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
              </div>

              <div className="pt-2 text-right text-base">
                <span className="font-semibold">Total:</span>{" "}
                <span className="font-extrabold">{formatSoles(subtotal)}</span>
              </div>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setMostrarResumen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPedido}
                disabled={enviando}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded"
              >
                {enviando ? "Enviando..." : "Confirmar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal éxito */}
      {pedidoExitoso && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-3">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-green-600 mb-2">✅ Pedido enviado</h3>
            <p className="mb-5 text-purple-700">Tu pedido fue enviado correctamente.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate("/menu")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Volver al Menú
              </button>
              <button
                onClick={() => navigate("/mis-pedidos")}
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
}
