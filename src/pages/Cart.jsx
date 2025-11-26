// src/pages/Cart.jsx 
import React, { useContext, useEffect, useState } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import { crearPedido } from "../services/pedidoService";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import PaymentFlowModal from "../components/PaymentFlowModal";
import { apiFetch } from "../utils/apiClient";

// 🔗 Base del backend para imágenes
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// 🖼️ Helper para construir URL de imagen
function getImageSrc(item) {
  const raw =
    item?.imagen_url ||
    item?.image ||
    item?.imagen ||
    item?.foto ||
    item?.url_imagen;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  return `${API_BASE}/uploads/${raw}`;
}

const formatSoles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

export default function Cart() {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    subtotal,
    regularSubtotal,
    savingsTotal,
    savingsPct,
    total,
  } = useContext(CartContext);

  // controla apertura del nuevo modal de flujo de pago
  const [mostrarResumen, setMostrarResumen] = useState(false);

  // éxito de pedido
  const [pedidoExitoso, setPedidoExitoso] = useState(false);
  const [ultimoPedido, setUltimoPedido] = useState(null); // datos del último pedido
  const [cuentaCreada, setCuentaCreada] = useState(false);
  const [mostrarFormularioCuenta, setMostrarFormularioCuenta] =
    useState(false);

  // formulario contraseña (para invitados)
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [creandoCuenta, setCreandoCuenta] = useState(false);

  const [errorStock, setErrorStock] = useState("");

  const navigate = useNavigate();
  const { search } = useLocation();

  const [usuarioNombre, setUsuarioNombre] = useState("Invitado");

  const [metodosPago, setMetodosPago] = useState([]);
  const [zonasEntrega, setZonasEntrega] = useState([]);
  const [horariosEntrega, setHorariosEntrega] = useState([]);
  const [metodosEntrega, setMetodosEntrega] = useState([]);

  // 🔐 Detección de sesión REAL:
  // solo consideramos logueado si hay token (authToken o token) Y usuario_id.
  const rawToken =
    (typeof window !== "undefined" &&
      (localStorage.getItem("authToken") || localStorage.getItem("token"))) ||
    null;
  const storedUserId =
    (typeof window !== "undefined" && localStorage.getItem("usuario_id")) ||
    null;
  const isLoggedIn = !!rawToken && !!storedUserId;

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

  /**
   * Recibe payload del PaymentFlowModal:
   * {
   *   zonaId,
   *   metodoEntregaId,
   *   horarioId,
   *   metodoPagoId,
   *   efectivoVuelto,
   *   comentarioPago,
   *   total,
   *   envio,
   *   nombreCompleto,
   *   direccion,
   *   email,
   *   telefono,
   *   metodoPagoNombre
   * }
   */
  async function handleConfirmarPedido(flowData) {
    try {
      const usuarioId = isLoggedIn
        ? Number(storedUserId)
        : null;

      const pedido = {
        usuario_id: usuarioId,
        metodo_pago_id: Number(flowData.metodoPagoId),
        metodo_entrega_id: Number(flowData.metodoEntregaId),
        zona_entrega_id: Number(flowData.zonaId),
        horario_entrega_id: Number(flowData.horarioId),
        comentario_pago: flowData.comentarioPago,

        // datos del cliente (para invitados y también para clientes por si quieres actualizar)
        cliente_nombre: flowData.nombreCompleto || null,
        cliente_email: flowData.email || null,
        cliente_telefono: flowData.telefono || null,
        cliente_direccion: flowData.direccion || null,

        productos: cartItems.map((i) => ({
          producto_id: i.id,
          cantidad: i.quantity,
          precio_unitario: i.price,
        })),
      };

      const res = await crearPedido(pedido);
      const pedidoId = res?.id || res?.pedido_id || null;

      // limpiar carrito
      clearCart();
      setMostrarResumen(false);

      // marcar si este pedido fue realmente "invited"
      const esInvitado = !isLoggedIn || !usuarioId;

      // guardar datos del último pedido para el modal de éxito
      setUltimoPedido({
        esInvitado,
        pedidoId,
        total: flowData.total,
        envio: flowData.envio,
        nombreCompleto:
          flowData.nombreCompleto ||
          localStorage.getItem("usuario_nombre") ||
          "Cliente Kokori",
        direccion: flowData.direccion || "",
        email: flowData.email || localStorage.getItem("usuario_email") || "",
        telefono: flowData.telefono || "",
        metodoPagoNombre: flowData.metodoPagoNombre || "",
      });
      setCuentaCreada(false);
      setMostrarFormularioCuenta(false);
      setPass1("");
      setPass2("");
      setPedidoExitoso(true);
    } catch (err) {
      console.error("Error al enviar pedido:", err);
      if (err?.message?.toLowerCase?.().includes("stock insuficiente")) {
        setErrorStock(err.message);
        toast.warn(`😢 ${err.message}`);
      } else {
        toast.error("❌ Error al enviar pedido");
      }
    }
  }

  // Crear cuenta a partir del pedido (solo invitados)
  async function handleCrearCuentaDesdePedido() {
    if (!ultimoPedido?.esInvitado) return;

    if (!pass1 || pass1.length < 6) {
      toast.warn("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pass1 !== pass2) {
      toast.warn("Las contraseñas no coinciden.");
      return;
    }
    if (!ultimoPedido.email) {
      toast.error(
        "No se encontró el correo del pedido. Vuelve atrás y completa los datos."
      );
      return;
    }

    try {
      setCreandoCuenta(true);

      const resp = await apiFetch("/api/auth/registro-desde-pedido", {
        method: "POST",
        body: JSON.stringify({
          nombre_completo: ultimoPedido.nombreCompleto,
          email: ultimoPedido.email,          // se mapea a "correoFinal" en el backend
          telefono: ultimoPedido.telefono,
          direccion: ultimoPedido.direccion,
          password: pass1,
          pedido_id: ultimoPedido.pedidoId,   // 👈 asociar ese pedido al nuevo usuario
        }),
      });

      if (!resp || !resp.token || !resp.usuario) {
        throw new Error("Respuesta inesperada al crear cuenta");
      }

      // Guardamos token en ambas claves por compatibilidad
      localStorage.setItem("authToken", resp.token);
      localStorage.setItem("token", resp.token);

      localStorage.setItem("usuario_id", resp.usuario.id);
      localStorage.setItem(
        "usuario_nombre",
        resp.usuario.nombre_completo || "Cliente Kokori"
      );
      if (resp.usuario.email) {
        localStorage.setItem("usuario_email", resp.usuario.email);
      }

      // MUY IMPORTANTE: este usuario NO es admin
      localStorage.setItem(
        "es_admin",
        resp.usuario.es_admin ? "true" : "false"
      );

      setUsuarioNombre(resp.usuario.nombre_completo || "Cliente Kokori");
      setCuentaCreada(true);
      setMostrarFormularioCuenta(false);

      toast.success("🎉 Cuenta creada con éxito. Ya puedes ver tus pedidos.");
    } catch (err) {
      console.error("Error creando cuenta desde pedido:", err);
      const msg = (err && err.message) || "";
      if (
        msg.toLowerCase().includes("correo") &&
        msg.toLowerCase().includes("existe")
      ) {
        toast.error(
          "Este correo ya está registrado. Inicia sesión para ver tus pedidos."
        );
      } else {
        toast.error("No se pudo crear la cuenta. Inténtalo nuevamente.");
      }
    } finally {
      setCreandoCuenta(false);
    }
  }

  const puedeVerPedidos =
    !ultimoPedido?.esInvitado || cuentaCreada || isLoggedIn;

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
              <h2 className="text-xl font-semibold text-purple-900">
                Tu carrito está vacío
              </h2>
              <p className="text-purple-600 mt-1">
                Agrega productos para continuar.
              </p>
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
                    Number(item.regular_price ?? 0) >
                      Number(item.price ?? 0);
                  const pct = isOffer
                    ? Math.round(
                        ((Number(item.regular_price) -
                          Number(item.price)) /
                          Number(item.regular_price)) *
                          100
                      )
                    : 0;

                  return (
                    <article
                      key={item.id}
                      className="bg-white rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition overflow-hidden"
                    >
                      <div className="grid grid-cols-[96px_1fr] sm:grid-cols-[112px_1fr] gap-4 p-4 sm:p-5">
                        {/* Miniatura */}
                        <div className="relative w-24 h-24 sm:w-[112px] sm:h-[112px] rounded-xl overflow-hidden bg-purple-50 border border-purple-100">
                          {img ? (
                            <img
                              src={img}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-cover object-center"
                              loading="lazy"
                              onError={(e) =>
                                (e.currentTarget.src = "/placeholder.png")
                              }
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-3xl">
                              {item.emoji || "🛍️"}
                            </div>
                          )}

                          {isOffer && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow">
                              -{pct}%
                            </span>
                          )}
                        </div>

                        {/* Info + acciones */}
                        <div className="min-w-0">
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

                          <div className="mt-3 flex flex-wrap items-center gap-3">
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
                                    toast.warning(
                                      `😵‍💫 Solo hay ${stock} unidades disponibles`
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 text-purple-700 hover:bg-purple-50"
                                aria-label="Aumentar"
                              >
                                +
                              </button>
                            </div>

                            <div className="ml-auto text-sm sm:text-base">
                              <span className="text-gray-500 mr-1">
                                Total:
                              </span>
                              <span className="font-bold text-purple-900">
                                {formatSoles(
                                  Number(item.price) * Number(item.quantity)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

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
                  <h2 className="text-lg font-semibold text-purple-900">
                    Resumen del pedido
                  </h2>

                  <div className="mt-4 space-y-2 text-sm">
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
                      <span className="font-medium">
                        {formatSoles(subtotal)}
                      </span>
                    </div>

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
                      <span className="font-semibold text-purple-800">
                        Total
                      </span>
                      <span className="font-extrabold text-purple-900">
                        {formatSoles(subtotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setMostrarResumen(true)}
                    className="w-full mt-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-3 font-semibold shadow hover:shadow-lg active:scale-[0.99] transition"
                  >
                    Continuar a envío y pago
                  </button>

                  <p className="text-[12px] text-gray-500 mt-3">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                      to="/login"
                      className="text-purple-600 font-semibold hover:underline"
                    >
                      Inicia sesión
                    </Link>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Al continuar, aceptas nuestras políticas de compra y
                    privacidad.
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
                  Continuar a envío y pago
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 🔥 Nuevo Modal de Flujo de Pago (2 etapas) */}
      <PaymentFlowModal
        open={mostrarResumen}
        onClose={() => setMostrarResumen(false)}
        subtotal={subtotal}
        zonas={zonasEntrega}
        metodosEntrega={metodosEntrega}
        horarios={horariosEntrega}
        metodosPago={metodosPago}
        onConfirm={handleConfirmarPedido}
      />

      {/* Modal éxito */}
      {pedidoExitoso && ultimoPedido && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-3">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
            {/* Título */}
            <h3 className="text-2xl font-bold text-green-600 mb-2 leading-snug">
              ✅ ¡Gracias por tu compra,
              <br />{" "}
              {ultimoPedido.nombreCompleto ||
                usuarioNombre ||
                "Cliente Kokori"}
              !
            </h3>
            <p className="mb-5 text-purple-700 text-sm">
              Tu pedido ha sido recibido correctamente. Te contactaremos para
              coordinar la entrega.
            </p>

            {/* Resumen mini */}
            <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-3 mb-5 text-left text-sm">
              <p className="font-semibold text-purple-900 mb-1">
                Resumen de tu pedido
              </p>
              <p className="flex justify-between">
                <span>Total pagado:</span>
                <span className="font-bold">
                  {formatSoles(ultimoPedido.total)}
                </span>
              </p>
              {ultimoPedido.direccion && (
                <p className="mt-1">
                  <span className="font-medium">Entrega en: </span>
                  {ultimoPedido.direccion}
                </p>
              )}
              {ultimoPedido.email && (
                <p className="mt-1 text-xs text-purple-700">
                  Te enviaremos los detalles a:
                  <br />
                  <span className="font-medium">
                    {ultimoPedido.email}
                  </span>
                </p>
              )}
            </div>

            {/* Bloque "crear cuenta" SOLO invitados que aún no crean cuenta */}
            {ultimoPedido.esInvitado && !cuentaCreada && (
              <>
                {!mostrarFormularioCuenta ? (
                  <>
                    <p className="text-xs text-gray-700 mb-4">
                      💡 Un paso más: crea tu cuenta gratis para guardar
                      tus datos y seguir tus pedidos fácilmente.
                    </p>
                    <button
                      onClick={() => setMostrarFormularioCuenta(true)}
                      className="w-full mb-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 text-sm font-semibold shadow hover:shadow-lg active:scale-[0.99] transition"
                    >
                      Crear cuenta gratis
                    </button>
                  </>
                ) : (
                  <div className="mb-4 text-left text-sm">
                    <p className="text-gray-700 mb-2">
                      Crea tu contraseña para completar tu cuenta en
                      KokoriShop:
                    </p>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={pass1}
                      onChange={(e) => setPass1(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={pass2}
                      onChange={(e) => setPass2(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      placeholder="Repite tu contraseña"
                    />

                    <button
                      onClick={handleCrearCuentaDesdePedido}
                      disabled={creandoCuenta}
                      className={`w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 text-sm font-semibold shadow hover:shadow-lg active:scale-[0.99] transition ${
                        creandoCuenta
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {creandoCuenta
                        ? "Creando cuenta..."
                        : "Guardar contraseña y crear cuenta"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Botones inferiores */}
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              <button
                onClick={() => {
                  setPedidoExitoso(false);
                  setUltimoPedido(null);
                  navigate("/");
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold"
              >
                {ultimoPedido.esInvitado && !cuentaCreada
                  ? "Seguir comprando"
                  : "Volver al Menú"}
              </button>

              {puedeVerPedidos && (
                <button
                  onClick={() => {
                    setPedidoExitoso(false);
                    setUltimoPedido(null);
                    navigate("/mis-pedidos");
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-semibold"
                >
                  Ver pedidos
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
