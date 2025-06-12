import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

  const confirmarPago = async (id) => {
    try {
      await axios.put(`http://localhost:3001/pedidos/${id}/confirmar-pago`);
      alert('✅ Pago confirmado y notificado');
      obtenerPedidos(); // Recarga pedidos actualizados
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
    }
  };

  useEffect(() => {
    obtenerPedidos();
  }, []);

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
    </div>
  );
};

export default AdminPedidos;
