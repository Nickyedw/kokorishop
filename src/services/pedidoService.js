// src/services/pedidoService.js

const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${API_APP}/api/pedidos`;

// (opcional) timeout simple para evitar requests colgados
function withTimeout(promise, ms = 15000) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Tiempo de espera excedido')), ms);
    promise.then(
      (res) => { clearTimeout(id); resolve(res); },
      (err) => { clearTimeout(id); reject(err); }
    );
  });
}

export const crearPedido = async (pedidoData) => {
  try {
    const token = localStorage.getItem('token');

    const res = await withTimeout(fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(pedidoData),
    }));

    // Manejo de errores del backend
    if (!res.ok) {
      let msg = 'Error al crear pedido';
      try {
        const errorData = await res.json();
        msg = errorData?.error || msg;
      } catch { /* respuesta no-JSON */ }
      throw new Error(msg);
    }

    return await res.json();
  } catch (error) {
    console.error('Error en crearPedido:', error);
    throw error;
  }
};
