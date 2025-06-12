<<<<<<< HEAD
// src/pages/AdminPedidos.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmarPagoButton from '../components/ConfirmarPagoButton';
import { Link } from 'react-router-dom'; // ✅ agregado
=======
import React, { useEffect, useState } from 'react';
import axios from 'axios';
>>>>>>> ac039c0 (Backend funcionando: conexión DB y endpoint /notificaciones y AdminPedidos)

const AdminPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const obtenerPedidos = async () => {
    try {
      const res = await axios.get('http://localhost:3001/pedidos');
      setPedidos(res.data);
    } catch (error) {
      console.error('❌ Error al obtener pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  const confirmarPago = async (id) => {
    try {
      await axios.put(`http://localhost:3001/pedidos/${id}/confirmar-pago`);
      alert('✅ Pago confirmado y notificado');
      obtenerPedidos(); // Recarga pedidos actualizados
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
    }
  };

>>>>>>> ac039c0 (Backend funcionando: conexión DB y endpoint /notificaciones y AdminPedidos)
  useEffect(() => {
    obtenerPedidos();
  }, []);

<<<<<<< HEAD
  if (loading) return <p className="p-4">⏳ Cargando pedidos...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">📦 Panel de Administración de Pedidos</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">Cliente</th>
              <th className="px-4 py-2 border-b">Estado</th>
              <th className="px-4 py-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="text-center hover:bg-gray-50">
                <td className="px-4 py-2 border-b">
                  <Link
                    to={`/admin/pedidos/${pedido.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    #{pedido.id}
                  </Link>
                </td>
                <td className="px-4 py-2 border-b">{pedido.cliente}</td>
                <td className="px-4 py-2 border-b capitalize">{pedido.estado}</td>
                <td className="px-4 py-2 border-b">
                  <ConfirmarPagoButton
                    pedidoId={pedido.id}
                    pagoConfirmado={pedido.pago_confirmado}
                    recargarPedidos={obtenerPedidos}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
=======
  if (loading) return <p>Cargando pedidos...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>📦 Panel de Administración de Pedidos</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <td>{pedido.id}</td>
              <td>{pedido.nombre_cliente}</td>
              <td>{pedido.estado}</td>
              <td>
                {pedido.estado === 'Pendiente' ? (
                  <button onClick={() => confirmarPago(pedido.id)}>
                    Confirmar pago
                  </button>
                ) : (
                  '✅ Confirmado'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
>>>>>>> ac039c0 (Backend funcionando: conexión DB y endpoint /notificaciones y AdminPedidos)
    </div>
  );
};

export default AdminPedidos;
