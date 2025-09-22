// src/services/pedidoService.js

const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${API_APP}/api/pedidos`;

/** Headers con token si existe */
function authHeaders() {
  const t = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

/** Helper de timeout */
function withTimeout(promise, ms = 15000) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Tiempo de espera excedido')), ms);
    promise.then(
      (res) => { clearTimeout(id); resolve(res); },
      (err) => { clearTimeout(id); reject(err); }
    );
  });
}

/** Helper para parsear errores del backend */
async function manejarRespuesta(res, msgDefecto = 'Error en la solicitud') {
  if (!res.ok) {
    let msg = msgDefecto;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch { /* respuesta no JSON */ }
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

/* =========================
   Crear pedido
   ========================= */
export async function crearPedido(pedidoData) {
  const res = await withTimeout(fetch(API_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(pedidoData),
  }));
  return manejarRespuesta(res, 'Error al crear pedido');
}

/* =========================
   Confirmar pago (ADMIN)
   ========================= */
export async function confirmarPago(pedidoId) {
  const res = await withTimeout(fetch(`${API_URL}/${pedidoId}/confirmar-pago`, {
    method: 'PUT',
    headers: authHeaders(),
  }));
  return manejarRespuesta(res, 'Error al confirmar pago');
}

/* =========================
   Listar pedidos (según usuario/estado)
   ========================= */
export async function obtenerPedidos(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_URL}?${qs}` : API_URL;

  const res = await withTimeout(fetch(url, {
    method: 'GET',
    headers: authHeaders(),
  }));
  return manejarRespuesta(res, 'Error al obtener pedidos');
}

/* =========================
   Cambiar estado (genérico)
   ========================= */
export async function actualizarEstadoPedido(pedidoId, estado) {
  const res = await withTimeout(fetch(`${API_URL}/${pedidoId}/estado`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ estado }),
  }));
  return manejarRespuesta(res, 'Error al actualizar estado');
}
