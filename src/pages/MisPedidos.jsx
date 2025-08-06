// src/pages/MisPedidos.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MisPedidos = () => {
  const usuario_nombre = localStorage.getItem('usuario_nombre') || 'Invitado';
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const token = localStorage.getItem('token');
      const usuario_id = localStorage.getItem('usuario_id');

      const res = await fetch(`http://localhost:3001/api/pedidos?usuario_id=${usuario_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Formato de datos inválido');
      }

      const pedidosConNumeros = data.map(p => ({
        ...p,
        total: Number(p.total || 0),
        productos: p.productos.map(prod => ({
          ...prod,
          subtotal: Number(prod.subtotal || 0)
        }))
      }));

      setPedidos(pedidosConNumeros);
    } catch (err) {
      console.error('❌ Error cargando pedidos:', err);
      setErrorMsg(err.message || 'Error al obtener pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  return (
    <div className="min-h-screen bg-purple-50 text-purple-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📦 Tus Pedidos, {usuario_nombre}</h1>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm shadow-md transition duration-200"
        >
          ← Volver a la Tienda
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Cargando pedidos...</p>}

      {errorMsg && (
        <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-2 rounded mb-4">
          {errorMsg}
        </div>
      )}

      {!loading && pedidos.length === 0 && (
        <p className="text-center text-gray-500">No tienes pedidos registrados aún 💤</p>
      )}

      <div className="space-y-4">
        {pedidos.map((pedido) => (
          <div
            key={pedido.id}
            className="bg-white shadow-md rounded-lg p-4 border-l-4 border-purple-400"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Pedido #{pedido.id}</h3>
              <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Estado: {pedido.estado || 'Pendiente'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Total: ${pedido.total.toFixed(2)} – Fecha: {new Date(pedido.fecha).toLocaleDateString()}<br />
              <span className="text-gray-700">💬 Comentario de Pago:</span> <em>{pedido.comentario_pago || '—'}</em>
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-6">
              {pedido.productos.map((prod) => (
                <li key={prod.id}>
                  {prod.producto_nombre} × {prod.cantidad} – ${prod.subtotal.toFixed(2)}
                </li>
              ))}
            </ul>

            <div className="text-right mt-4">
              <Link
                to={`/mis-pedidos/${pedido.id}`}
                className="text-purple-600 hover:underline text-sm"
              >
                Ver detalles →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisPedidos;
