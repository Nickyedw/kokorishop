// src/components/ConfirmarPagoButton.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ConfirmarPagoButton = ({ pedidoId, pagoConfirmado, recargarPedidos }) => {
  const [loading, setLoading] = useState(false);

  const confirmarPago = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }
      setLoading(true);

      await axios.put(
        `${API_APP}/api/pedidos/${pedidoId}/confirmar-pago`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Pago confirmado y cliente notificado');
      await Promise.resolve(recargarPedidos?.());
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
      const s = error?.response?.status;
      if (s === 401) {
        alert('Tu sesión no es válida o expiró. Vuelve a iniciar sesión.');
      } else if (s === 403) {
        alert('No tienes permisos para confirmar pagos (requiere rol admin).');
      } else if (s === 404) {
        alert('Pedido no encontrado.');
      } else {
        alert(`❌ Error al confirmar el pago: ${error?.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (pagoConfirmado) {
    return <span className="text-green-600 font-semibold">✅ Confirmado</span>;
  }

  return (
    <button
      onClick={confirmarPago}
      disabled={loading}
      className={`${
        loading ? 'opacity-60 cursor-not-allowed' : ''
      } bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition duration-300`}
    >
      {loading ? 'Confirmando…' : 'Confirmar Pago'}
    </button>
  );
};

export default ConfirmarPagoButton;
