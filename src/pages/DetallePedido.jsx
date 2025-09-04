// src/pages/DetallePedido.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ConfirmarPagoButton from "../components/ConfirmarPagoButton";
import AdminShell from "../components/admin/AdminShell";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DetallePedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  const usuario_nombre = localStorage.getItem("usuario_nombre") || "Invitado";

  const obtenerDetalle = async () => {
    try {
      setLoading(true);
      // Aseguramos el mismo prefijo que el resto del admin
      const res = await axios.get(`${API_BASE}/api/pedidos/${id}`);
      setPedido(res.data);
    } catch (error) {
      console.error("❌ Error al obtener detalle del pedido:", error);
      setPedido(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const badgeByEstado = (estado) => {
    const map = {
      "pendiente": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "pago confirmado": "bg-green-100 text-green-800 border-green-300",
      "listo para entrega": "bg-indigo-100 text-indigo-800 border-indigo-300",
      "pedido enviado": "bg-blue-100 text-blue-800 border-blue-300",
      "pedido entregado": "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
    return map[estado] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (loading) {
    return (
      <AdminShell title={`Detalle del Pedido #${id}`}>
        <div className="p-4 text-gray-500">⏳ Cargando detalle…</div>
      </AdminShell>
    );
  }

  if (!pedido) {
    return (
      <AdminShell title="Detalle del Pedido">
        <div className="p-4">
          <button
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
          <p className="text-red-600">❌ Pedido no encontrado.</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Detalle del Pedido #${pedido.id}`}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            onClick={() => navigate("/admin/pedidos")}
            title="Volver a la lista"
          >
            ← Volver a Pedidos
          </button>
          <span className="text-sm text-gray-500">Cliente: {usuario_nombre}</span>
        </div>

        <div className="bg-white rounded shadow p-4 mb-4 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
            <p>
              <span className="text-gray-500">Cliente:</span>{" "}
              <strong>{pedido.cliente}</strong>
            </p>
            <p>
              <span className="text-gray-500">Fecha:</span>{" "}
              {new Date(pedido.fecha).toLocaleString()}
            </p>
            <p>
              <span className="text-gray-500">Total:</span>{" "}
              <strong>S/ {Number(pedido.total || 0).toFixed(2)}</strong>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-gray-500">Estado:</span>
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${badgeByEstado(
                  pedido.estado
                )}`}
              >
                {pedido.estado}
              </span>
            </p>
          </div>

          <div className="mt-3 text-sm text-gray-700">
            <p className="text-gray-600">
              <strong>Comentario de pago:</strong>
            </p>
            <p className="mt-1">{pedido.comentario_pago || "—"}</p>

            {pedido.pago_confirmado && (
              <p className="text-green-600 mt-2">
                ✅ Pago confirmado el{" "}
                {new Date(pedido.fecha_confirmacion_pago).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <ConfirmarPagoButton
            pedidoId={pedido.id}
            pagoConfirmado={pedido.pago_confirmado}
            recargarPedidos={obtenerDetalle}
          />
        </div>

        <h3 className="mt-6 text-lg font-semibold text-gray-800">
          🛒 Productos del Pedido
        </h3>

        {Array.isArray(pedido.productos) && pedido.productos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full mt-2 border border-gray-300 text-sm bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border-b text-left">Producto</th>
                  <th className="px-3 py-2 border-b">Cantidad</th>
                  <th className="px-3 py-2 border-b">Precio Unitario</th>
                  <th className="px-3 py-2 border-b">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos.map((prod) => (
                  <tr key={prod.id} className="text-center hover:bg-gray-50">
                    <td className="px-3 py-2 border-b text-left">
                      {prod.producto_nombre}
                    </td>
                    <td className="px-3 py-2 border-b">{prod.cantidad}</td>
                    <td className="px-3 py-2 border-b">
                      S/ {Number(prod.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 border-b">
                      S/ {Number(prod.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">
            No hay productos en este pedido.
          </p>
        )}
      </div>
    </AdminShell>
  );
}
