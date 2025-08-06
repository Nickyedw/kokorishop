// src/services/pedidoService.js

const API_URL = 'http://localhost:3001/api/pedidos'; // ✅ ruta corregida

export const crearPedido = async (pedidoData) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData),
    });
   if (!res.ok) {
      const errorData = await res.json(); // <- captura mensaje del backend
      throw new Error(errorData?.error || 'Error al crear pedido');
    }

    return await res.json();
  } catch (error) {
    console.error('Error en crearPedido:', error);
    throw error;
  }
};
