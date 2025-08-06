import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const DetalleClientePedido = () => {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/pedidos/${id}`);
        const data = await res.json();
        setPedido(data);
      } catch (error) {
        console.error('Error al cargar pedido:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [id]);

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!pedido) return <p className="p-6 text-red-500">No se encontró el pedido.</p>;

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">🧾 Detalles del Pedido #{pedido.id}</h2>
      <p><strong>Cliente:</strong> {pedido.cliente}</p>
      <p><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleString()}</p>
      <p><strong>Total:</strong> ${pedido.total}</p>
      <p><strong>Estado:</strong> {pedido.estado}</p>
      <p><strong>Comentario de Pago:</strong>{pedido.comentario_pago || '—'}</p>

      <h3 className="text-xl mt-6 mb-2 font-semibold">Productos:</h3>
      <ul className="space-y-2">
        {pedido.productos.map(p => (
          <li key={p.id} className="border p-3 rounded">
            {p.producto_nombre} × {p.cantidad} — <strong>${p.subtotal}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetalleClientePedido;
