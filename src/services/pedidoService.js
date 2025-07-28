// src/services/pedidoService.js

const API_URL = 'http://localhost:3001/api/pedidos'; // ✅ ruta corregida

export const crearPedido = async (pedidoData) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData),
    });
    if (!res.ok) throw new Error('Error al crear pedido');
    return await res.json();
  } catch (error) {
    console.error('crearPedido:', error);
    throw error;
  }
};
