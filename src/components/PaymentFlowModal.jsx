// src/components/PaymentFlowModal.jsx
import React, { useState } from "react";
import { FaTimes, FaWhatsapp, FaCopy, FaTruck } from "react-icons/fa";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - subtotal: number
 * - zonas: array (zonasEntrega)
 * - metodosEntrega: array
 * - horarios: array
 * - metodosPago: array
 * - onConfirm: (payload) => Promise | void
 *
 * payload que se devuelve a Cart.jsx:
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

export default function PaymentFlowModal({
  open,
  onClose,
  subtotal = 0,
  zonas = [],
  metodosEntrega = [],
  horarios = [],
  metodosPago = [],
  onConfirm,
}) {
  const [step, setStep] = useState(1);

  const [zonaId, setZonaId] = useState("");
  const [metodoEntregaId, setMetodoEntregaId] = useState("");
  const [horarioId, setHorarioId] = useState("");

  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [efectivoVuelto, setEfectivoVuelto] = useState("");
  const [isSending, setIsSending] = useState(false);

  // datos de contacto (solo invitado)
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [direccion, setDireccion] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  if (!open) return null;

  const isLoggedIn = !!localStorage.getItem("authToken");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const QR_PLIN = `${API_BASE}/assets/pagos/qr-plin.png`;
  const QR_YAPE = `${API_BASE}/assets/pagos/qr-yape.png`;

  const WHATSAPP_NUMBER = "+51977546073";
  const WHATSAPP_DISPLAY = "+51 977 546 073";
  const WHATSAPP_LINK =
    import.meta.env.VITE_SOCIAL_WHATSAPP ||
    `https://wa.me/51977546073?text=${encodeURIComponent(
      "Hola KokoriShop 💜, te envío el comprobante de mi pedido."
    )}`;

  const BCP_ACCOUNT = "191-09386219-00-76";
  const BCP_HOLDER = "Edwin Gonzales Estrada";

  const S = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
  const norm = (s = "") => s.toString().toLowerCase().trim();

  // === Cálculo de envío y total ===
  const zonaSeleccionada = zonas.find((z) => String(z.id) === String(zonaId));
  const envio = zonaSeleccionada
    ? Number(
        zonaSeleccionada.costo_envio ??
          zonaSeleccionada.costo ??
          zonaSeleccionada.monto ??
          0
      )
    : 0;
  const total = subtotal + envio;

  const metodoPago = metodosPago.find(
    (m) => String(m.id) === String(metodoPagoId)
  );
  const metodoPagoNombre = metodoPago?.nombre || "";

  // Validaciones de pasos
  const camposContactoOk =
    isLoggedIn ||
    (nombreCompleto.trim() &&
      direccion.trim() &&
      email.trim() &&
      telefono.trim());

  const canGoStep2 =
    !!zonaId && !!metodoEntregaId && !!horarioId && camposContactoOk;

  const canConfirm = !!metodoPagoId && !isSending;

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn("No se pudo copiar:", err);
    }
  };

  const handleCloseAll = () => {
    setStep(1);
    setMetodoPagoId("");
    setEfectivoVuelto("");
    onClose?.();
  };

  const handleConfirmInternal = async () => {
    if (!canConfirm || !onConfirm) return;
    setIsSending(true);

    try {
      const totalTexto = S(total);
      let comentarioPago = "";

      switch (norm(metodoPagoNombre)) {
        case "efectivo":
        case "efectivo al momento de entrega":
          comentarioPago = `Pago en efectivo al momento de entrega. Total: ${totalTexto}. ${
            efectivoVuelto
              ? `Cliente indica que pagará con ${efectivoVuelto} para recibir vuelto.`
              : "El cliente no indicó monto de vuelto."
          }`;
          break;

        case "transferencia bancaria":
        case "transferencia":
        case "transferencia bcp":
          comentarioPago = `Pago por transferencia bancaria BCP. Total: ${totalTexto}. Cuenta: ${BCP_ACCOUNT} a nombre de ${BCP_HOLDER}. El cliente debe enviar el voucher por WhatsApp a ${WHATSAPP_DISPLAY}.`;
          break;

        case "yape":
          comentarioPago = `Pago por Yape al número ${WHATSAPP_DISPLAY}. Total: ${totalTexto}. Cliente debe enviar captura del Yapeo por WhatsApp.`;
          break;

        case "plin":
          comentarioPago = `Pago por Plin al número ${WHATSAPP_DISPLAY}. Total: ${totalTexto}. Cliente debe enviar captura del pago por WhatsApp.`;
          break;

        default:
          comentarioPago = `Método de pago: ${metodoPagoNombre}. Total: ${totalTexto}.`;
      }

      const payload = {
        zonaId,
        metodoEntregaId,
        horarioId,
        metodoPagoId,
        efectivoVuelto: efectivoVuelto || null,
        comentarioPago,
        total,
        envio,
        nombreCompleto: nombreCompleto.trim(),
        direccion: direccion.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        metodoPagoNombre,
      };

      await onConfirm(payload);
    } finally {
      setIsSending(false);
    }
  };

  const renderInstruccionesPago = () => {
    const totalTexto = S(total);

    switch (norm(metodoPagoNombre)) {
      case "":
        return (
          <p className="text-sm text-gray-500">
            Selecciona un método de pago para ver las instrucciones. 💜
          </p>
        );

      case "efectivo":
      case "efectivo al momento de entrega":
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">
              💵 Pago en efectivo al recibir
            </h4>
            <p className="text-sm text-gray-700">
              Pagarás <strong>{totalTexto}</strong> directamente a nuestro
              repartidor al momento de la entrega.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <p className="text-sm font-medium text-amber-900">
                ¿Necesitas cambio/vuelto?
              </p>
              <input
                type="text"
                value={efectivoVuelto}
                onChange={(e) => setEfectivoVuelto(e.target.value)}
                placeholder="Ej: pagaré con S/ 100"
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
              />

              <div className="flex flex-wrap gap-2 text-xs">
                {["S/ 50", "S/ 100", "S/ 200"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEfectivoVuelto(m)}
                    className="px-3 py-1 rounded-full border border-amber-300 bg-white hover:bg-amber-100"
                  >
                    {m}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setEfectivoVuelto("")}
                  className="px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Otro monto
                </button>
              </div>
            </div>
          </div>
        );

      case "transferencia bancaria":
      case "transferencia":
      case "transferencia bcp":
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">
              🏦 Instrucciones de transferencia bancaria
            </h4>
            <p className="text-sm text-gray-700">
              Realiza una transferencia por{" "}
              <strong>{totalTexto}</strong> a la siguiente cuenta:
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2 text-sm">
              <RowCopy label="Banco" value="BCP" onCopy={handleCopy} />
              <RowCopy
                label="Cuenta Ahorros"
                value={BCP_ACCOUNT}
                onCopy={handleCopy}
              />
              <RowCopy
                label="Titular"
                value={BCP_HOLDER}
                onCopy={handleCopy}
              />
            </div>

            <PasoFinalWhatsApp
              WHATSAPP_LINK={WHATSAPP_LINK}
              WHATSAPP_DISPLAY={WHATSAPP_DISPLAY}
            />
          </div>
        );

      case "yape":
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">
              📱 Pago fácil con Yape
            </h4>
            <p className="text-sm text-gray-700">
              Yapea <strong>{totalTexto}</strong> al siguiente número:
            </p>

            <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 space-y-2 text-sm">
              <RowCopy
                label="Yape"
                value={WHATSAPP_DISPLAY}
                onCopy={handleCopy}
              />
              <RowCopy
                label="Titular"
                value={BCP_HOLDER}
                onCopy={handleCopy}
              />
            <p className="text-sm font-semibold text-gray-900">Código QR Yape:</p>
            <div className="flex justify-center">
              <img
                src={QR_YAPE}
                alt="QR Yape"
                className="w-48 h-48 rounded-xl shadow-lg border"
              />
            </div>
            </div>

            <PasoFinalWhatsApp
              WHATSAPP_LINK={WHATSAPP_LINK}
              WHATSAPP_DISPLAY={WHATSAPP_DISPLAY}
            />
          </div>
        );

      case "plin": 
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">📲 Pago rápido con Plin</h4>
          <p className="text-sm text-gray-700">
            Transfiere <strong>{totalTexto}</strong> al número afiliado a Plin:
          </p>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2 text-sm">
            <RowCopy label="Plin" value={WHATSAPP_DISPLAY} onCopy={handleCopy} />
            <RowCopy label="Titular" value={BCP_HOLDER} onCopy={handleCopy} />

            <p className="text-sm font-semibold text-gray-900">Código QR Plin:</p>
            <div className="flex justify-center">
              <img
                src={QR_PLIN}
                alt="QR Plin"
                className="w-48 h-48 rounded-xl shadow-lg border"
              />
            </div>
          </div>

          <PasoFinalWhatsApp
            WHATSAPP_LINK={WHATSAPP_LINK}
            WHATSAPP_DISPLAY={WHATSAPP_DISPLAY}
          />
        </div>
      );

      default:
        return (
          <p className="text-sm text-gray-700">
            Método de pago seleccionado:{" "}
            <strong>{metodoPagoNombre}</strong>. El total a pagar es{" "}
            <strong>{totalTexto}</strong>.
          </p>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleCloseAll}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-[95%] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-purple-600 to-pink-500 text-white">
          <div>
            <h2 className="font-semibold text-lg">
              {step === 1 ? "Resumen de Pedido" : "Método de Pago"}
            </h2>
            <p className="text-xs text-purple-100">
              Paso {step} de 2 · Total {S(total)}
            </p>
          </div>
          <button
            onClick={handleCloseAll}
            className="h-8 w-8 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/30"
          >
            <FaTimes />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Detalle costos */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3 flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 text-purple-900 font-semibold">
              <FaTruck className="text-purple-600" />
              <span>Detalle de costos</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{S(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{zonaSeleccionada ? S(envio) : "A calcular…"}</span>
            </div>
            <hr className="my-1 border-purple-100" />
            <div className="flex justify-between font-bold text-purple-700">
              <span>Total a pagar</span>
              <span>{S(total)}</span>
            </div>
          </div>

          {step === 1 ? (
            <StepEntrega
              zonas={zonas}
              metodosEntrega={metodosEntrega}
              horarios={horarios}
              zonaId={zonaId}
              setZonaId={setZonaId}
              metodoEntregaId={metodoEntregaId}
              setMetodoEntregaId={setMetodoEntregaId}
              horarioId={horarioId}
              setHorarioId={setHorarioId}
              isLoggedIn={isLoggedIn}
              nombreCompleto={nombreCompleto}
              setNombreCompleto={setNombreCompleto}
              direccion={direccion}
              setDireccion={setDireccion}
              email={email}
              setEmail={setEmail}
              telefono={telefono}
              setTelefono={setTelefono}
            />
          ) : (
            <StepPago
              metodosPago={metodosPago}
              metodoPagoId={metodoPagoId}
              setMetodoPagoId={setMetodoPagoId}
              renderInstruccionesPago={renderInstruccionesPago}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between gap-3">
          <button
            onClick={handleCloseAll}
            className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-sm"
          >
            Cancelar
          </button>

          {step === 1 ? (
            <button
              disabled={!canGoStep2}
              onClick={() => canGoStep2 && setStep(2)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                canGoStep2
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              Continuar al pago
            </button>
          ) : (
            <button
              disabled={!canConfirm}
              onClick={handleConfirmInternal}
              className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                canConfirm
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              {isSending ? "Procesando…" : "Confirmar pedido"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======== Subcomponentes ======== */

function StepEntrega({
  zonas,
  metodosEntrega,
  horarios,
  zonaId,
  setZonaId,
  metodoEntregaId,
  setMetodoEntregaId,
  horarioId,
  setHorarioId,
  isLoggedIn,
  nombreCompleto,
  setNombreCompleto,
  direccion,
  setDireccion,
  email,
  setEmail,
  telefono,
  setTelefono,
}) {
  const labelZona = (z) =>
    z.nombre || z.nombre_zona || z.descripcion || `Zona ${z.id}`;

  const labelHorario = (h) =>
    h.nombre ||
    (h.hora_inicio && h.hora_fin
      ? `${h.hora_inicio.slice(0, 5)} - ${h.hora_fin.slice(0, 5)}`
      : `Horario ${h.id}`);

  const labelMetodoEntrega = (m) =>
    m.nombre || m.descripcion || `Método ${m.id}`;

  const costoZona = (z) =>
    Number(
      z.costo_envio ?? z.costo ?? z.costo_envio_soles ?? z.monto ?? 0
    ).toFixed(2);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm">
        📍 Datos de entrega
      </h3>

      <div className="space-y-3 text-sm">
        {/* Si es invitado, pedimos datos de contacto */}
        {!isLoggedIn && (
          <div className="space-y-3 rounded-2xl border border-purple-100 bg-purple-50/40 p-3">
            <p className="text-xs text-purple-800 font-medium">
              Datos del contacto (para coordinar y enviar el resumen de tu
              pedido)
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
                placeholder="Ej: Ana Sotomayor"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Dirección completa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
                placeholder="Ej: Av. Los Claveles 123, San Borja"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
                placeholder="Ej: micorreo@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Teléfono / WhatsApp{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
                placeholder="Ej: 977 546 073"
              />
            </div>
          </div>
        )}

        {/* Zona */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Zona de entrega <span className="text-red-500">*</span>
          </label>
          <select
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
          >
            <option value="">Seleccione una zona…</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {labelZona(z)} {`(S/ ${costoZona(z)})`}
              </option>
            ))}
          </select>
        </div>

        {/* Método de entrega */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Método de entrega
          </label>
          <select
            value={metodoEntregaId}
            onChange={(e) => setMetodoEntregaId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
          >
            <option value="">Seleccione…</option>
            {metodosEntrega.map((m) => (
              <option key={m.id} value={m.id}>
                {labelMetodoEntrega(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Horario */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Horario de entrega
          </label>
          <select
            value={horarioId}
            onChange={(e) => setHorarioId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
          >
            <option value="">Seleccione…</option>
            {horarios.map((h) => (
              <option key={h.id} value={h.id}>
                {labelHorario(h)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function StepPago({
  metodosPago,
  metodoPagoId,
  setMetodoPagoId,
  renderInstruccionesPago,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm">
        💳 Método de pago
      </h3>

      <div className="space-y-3 text-sm">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Selecciona tu método de pago
          </label>
          <select
            value={metodoPagoId}
            onChange={(e) => setMetodoPagoId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white"
          >
            <option value="">Elige una opción…</option>
            {metodosPago.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
          {renderInstruccionesPago()}
        </div>
      </div>
    </div>
  );
}

function RowCopy({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900 text-sm truncate">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="ml-2 px-2 py-1 rounded-full bg-white border border-gray-200 text-xs flex items-center gap-1 hover:bg-gray-100"
      >
        <FaCopy className="h-3 w-3" />
        Copiar
      </button>
    </div>
  );
}

function PasoFinalWhatsApp({ WHATSAPP_LINK, WHATSAPP_DISPLAY }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2 text-sm">
      <p className="font-medium text-emerald-900">
        Paso final: enviar comprobante
      </p>
      <p className="text-emerald-900/90">
        Envía la captura del pago a nuestro WhatsApp para confirmar tu
        compra:
      </p>
      <p className="font-semibold text-emerald-900">{WHATSAPP_DISPLAY}</p>
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"
      >
        <FaWhatsapp /> Abrir WhatsApp
      </a>
    </div>
  );
}
