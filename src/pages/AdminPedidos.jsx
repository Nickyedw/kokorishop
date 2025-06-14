// src/pages/AdminPedidos.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmarPagoButton from '../components/ConfirmarPagoButton';
import { Link } from 'react-router-dom'; // ✅ agregado

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

  useEffect(() => {
    obtenerPedidos();
  }, []);

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
    </div>
  );
};

export default AdminPedidos;
