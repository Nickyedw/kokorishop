// src/components/ConfirmarPagoButton.jsx
import React from 'react';
import axios from 'axios';

const ConfirmarPagoButton = ({ pedidoId, pagoConfirmado, recargarPedidos }) => {
  const confirmarPago = async () => {
    try {
      await axios.put(`http://localhost:3001/api/pedidos/${pedidoId}/confirmar-pago`);
      alert('✅ Pago confirmado y cliente notificado');
      recargarPedidos();
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
      alert('❌ Error al confirmar el pago. Intenta nuevamente.');
    }
  };

  if (pagoConfirmado) {
    return <span className="text-green-600 font-semibold">✅ Confirmado</span>;
  }

  return (
    <button
      onClick={confirmarPago}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition duration-300"
    >
      Confirmar Pago
    </button>
  );
};

export default ConfirmarPagoButton;
