import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmarPagoButton from '../components/ConfirmarPagoButton';

const DetallePedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  const obtenerDetalle = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/pedidos/${id}`);
      setPedido(res.data);
    } catch (error) {
      console.error('❌ Error al obtener detalle del pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="p-4">⏳ Cargando detalle...</p>;
  if (!pedido) return <p className="p-4">❌ Pedido no encontrado</p>;

  // Etiqueta de estado con color según el valor
  const estadoClase = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmado: 'bg-green-100 text-green-800 border-green-300',
    entregado: 'bg-blue-100 text-blue-800 border-blue-300',
    cancelado: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <h2 className="text-2xl font-bold mb-2 text-gray-800">📄 Detalle del Pedido #{pedido.id}</h2>

      <div className="bg-white rounded shadow p-4 mb-4 border border-gray-200">
        <p className="text-gray-700">
          Cliente: <strong>{pedido.cliente}</strong><br />
          Fecha: {new Date(pedido.fecha).toLocaleString()}<br />
          Total: <strong>S/ {parseFloat(pedido.total).toFixed(2)}</strong><br />
          Estado:{' '}
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${estadoClase[pedido.estado] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
            {pedido.estado}
          </span>
        </p>
        {pedido.pago_confirmado && (
          <p className="text-sm text-green-600 mt-2">
            ✅ Pago confirmado el {new Date(pedido.fecha_confirmacion_pago).toLocaleString()}
          </p>
        )}
      </div>

      <ConfirmarPagoButton
        pedidoId={pedido.id}
        pagoConfirmado={pedido.pago_confirmado}
        recargarPedidos={obtenerDetalle}
      />

      <h3 className="mt-6 text-lg font-semibold text-gray-800">🛒 Productos del Pedido</h3>
      {pedido.productos?.length > 0 ? (
        <table className="w-full mt-2 border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border-b">Producto</th>
              <th className="px-3 py-2 border-b">Cantidad</th>
              <th className="px-3 py-2 border-b">Precio Unitario</th>
              <th className="px-3 py-2 border-b">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.productos.map((prod) => (
              <tr key={prod.id} className="text-center hover:bg-gray-50">
                <td className="px-3 py-2 border-b">{prod.producto_nombre}</td>
                <td className="px-3 py-2 border-b">{prod.cantidad}</td>
                <td className="px-3 py-2 border-b">S/ {parseFloat(prod.precio_unitario).toFixed(2)}</td>
                <td className="px-3 py-2 border-b">S/ {parseFloat(prod.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 mt-2">No hay productos en este pedido.</p>
      )}
    </div>
  );
};

export default DetallePedido;
