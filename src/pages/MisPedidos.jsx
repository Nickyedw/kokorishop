// src/pages/MisPedidos.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001';

const pasosEstado = [
  'pendiente',
  'pago confirmado',
  'listo para entrega',
  'pedido enviado',
  'pedido entregado',
];

const MisPedidos = () => {
  const usuario_nombre = localStorage.getItem('usuario_nombre') || 'Invitado';
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null); // objeto del pedido
  const [cargandoModal, setCargandoModal] = useState(false);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const token = localStorage.getItem('token');
      const usuario_id = localStorage.getItem('usuario_id');

      const res = await fetch(`${API_BASE}/api/pedidos?usuario_id=${usuario_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Formato de datos inválido');

      const pedidosNormalizados = data.map(p => ({
        ...p,
        total: Number(p.total || 0),
        productos: (p.productos || []).map(prod => ({
          ...prod,
          subtotal: Number(prod.subtotal || 0),
        })),
      }));

      setPedidos(pedidosNormalizados);
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

  // -------- helpers UI --------
  const indicePaso = (estado = '') =>
    Math.max(0, pasosEstado.indexOf((estado || '').toLowerCase()));

  const colorEstado = (estado) => {
    switch ((estado || '').toLowerCase()) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'pago confirmado': return 'bg-green-100 text-green-800';
      case 'listo para entrega': return 'bg-blue-100 text-blue-800';
      case 'pedido enviado': return 'bg-indigo-100 text-indigo-800';
      case 'pedido entregado': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // -------- modal --------
  const abrirModal = async (pedidoId) => {
    try {
      setCargandoModal(true);
      setModalAbierto(true);

      // Traer detalle completo y fresco (incluye producto_imagen)
      const res = await fetch(`${API_BASE}/api/pedidos/${pedidoId}`);
      const data = await res.json();

      // Normalizar numéricos
      const pedidoOk = {
        ...data,
        total: Number(data.total || 0),
        productos: (data.productos || []).map(d => ({
          ...d,
          subtotal: Number(d.subtotal || 0),
        }))
      };

      setPedidoSeleccionado(pedidoOk);
    } catch (e) {
      console.error('Error cargando detalle modal:', e);
      setPedidoSeleccionado(null);
    } finally {
      setCargandoModal(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPedidoSeleccionado(null);
  };

  const urlImagen = (imagen_url) => {
    if (!imagen_url) return '/img/no-image.png';
    if (imagen_url.startsWith('http')) return imagen_url;
    return `${API_BASE}${imagen_url.startsWith('/') ? '' : '/'}${imagen_url}`;
  };

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
        {pedidos.map((pedido) => {
          const paso = indicePaso(pedido.estado);
          return (
            <div
              key={pedido.id}
              className="bg-white shadow-md rounded-lg p-4 border-l-4 border-purple-400"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Pedido #{pedido.id}</h3>
                <span className={`text-sm px-2 py-1 rounded-full ${colorEstado(pedido.estado)}`}>
                  Estado: {pedido.estado || 'Pendiente'}
                </span>
              </div>

              {/* Línea de estado (progress de 5 pasos) */}
              <div className="mt-2 mb-3">
                <div className="flex items-center">
                  {pasosEstado.map((et, i) => (
                    <div key={et} className="flex items-center w-full last:w-auto">
                      <div
                        className={`h-2 rounded-full w-full ${i <= paso ? 'bg-purple-600' : 'bg-gray-200'}`}
                      />
                      {i < pasosEstado.length - 1 && <div className="w-3" />}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-gray-600">
                  {pasosEstado.map(et => <span key={et} className="w-1/5 text-center">{et}</span>)}
                </div>
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
                <button
                  onClick={() => abrirModal(pedido.id)}
                  className="text-purple-600 hover:underline text-sm"
                >
                  Ver detalles →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de detalle */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 w-full max-w-3xl rounded-xl shadow-xl overflow-hidden relative">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b">
              <h3 className="text-lg font-semibold">
                Detalle del Pedido {pedidoSeleccionado ? `#${pedidoSeleccionado.id}` : ''}
              </h3>
              <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[70vh] overflow-auto">
              {cargandoModal && <p>Cargando detalle…</p>}
              {!cargandoModal && pedidoSeleccionado && (
                <>
                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    <span><strong>Cliente:</strong> {pedidoSeleccionado.cliente}</span>
                    <span><strong>Fecha:</strong> {new Date(pedidoSeleccionado.fecha).toLocaleString()}</span>
                    <span><strong>Total:</strong> ${pedidoSeleccionado.total.toFixed(2)}</span>
                    <span><strong>Estado:</strong> {pedidoSeleccionado.estado}</span>
                  </div>

                  <p className="text-sm mb-4">
                    <strong>Comentario de Pago:</strong> {pedidoSeleccionado.comentario_pago || '—'}
                  </p>

                  {/* Productos con miniatura */}
                  <div className="space-y-3">
                    {pedidoSeleccionado.productos.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 border rounded-md p-2">
                        <img
                          src={urlImagen(p.producto_imagen_url)}
                          alt={p.producto_nombre}
                          className="w-14 h-14 object-cover rounded-md border"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{p.producto_imagen_url}</div>
                          <div className="text-xs text-gray-600">
                            Cant: {p.cantidad} &nbsp;·&nbsp;
                            PU: ${Number(p.precio_unitario).toFixed(2)} &nbsp;·&nbsp;
                            Subtotal: ${Number(p.subtotal).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t flex justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={cerrarModal}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
