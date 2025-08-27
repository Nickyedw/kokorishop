// src/services/productService.js

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE}/api/productos`;

/* ======================
   Productos (CRUD básico)
   ====================== */
export const getProductos = async () => {
  const res = await fetch(`${API_URL}?bust=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener productos');
  return await res.json();
};

export const getProducto = async (id) => {
  const res = await fetch(`${API_URL}/${id}?bust=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener producto');
  return await res.json();
};

export async function createProducto(data) {
  const formData = new FormData();
  formData.append('nombre', data.nombre);
  formData.append('descripcion', data.descripcion);
  formData.append('precio', data.precio);
  formData.append('stock_actual', data.stock_actual ?? data.stock ?? 0);
  formData.append('stock_minimo', data.stock_minimo ?? 5);
  formData.append('categoria_id', data.categoria_id);
  if (data.imagenFile) formData.append('imagen', data.imagenFile);

  const res = await fetch(API_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Error al crear producto: ' + (await res.text()));
  return await res.json();
}

/**
 * Actualiza el producto.
 * - Si trae imagen -> multipart/form-data.
 * - Si NO trae imagen -> application/json (para poder enviar flags y precio_regular).
 */
export const updateProducto = async (id, producto) => {
  const hasFile = !!producto.imagenFile;

  if (hasFile) {
    // MULTIPART
    const formData = new FormData();
    if (producto.nombre?.trim()) formData.append('nombre', producto.nombre);
    if (producto.descripcion?.trim()) formData.append('descripcion', producto.descripcion);
    if (producto.precio !== '' && producto.precio !== undefined && producto.precio !== null) {
      formData.append('precio', producto.precio);
    }
    if (producto.stock_minimo != null && producto.stock_minimo !== '') {
      formData.append('stock_minimo', producto.stock_minimo);
    }
    if (producto.categoria_id != null && producto.categoria_id !== '') {
      formData.append('categoria_id', producto.categoria_id);
    }
    // ⚠️ en multipart el backend también soporta booleanos, pero
    // preferimos enviarlos cuando usemos JSON. (Si quisieras, podrías
    // descomentar las 3 líneas siguientes y también funcionaría)
    // if ('en_oferta' in producto) formData.append('en_oferta', String(producto.en_oferta));
    // if ('destacado' in producto) formData.append('destacado', String(producto.destacado));
    // if ('precio_regular' in producto) formData.append('precio_regular', producto.precio_regular);

    formData.append('imagen', producto.imagenFile);

    const res = await fetch(`${API_URL}/${id}`, { method: 'PUT', body: formData });
    if (!res.ok) throw new Error('Error al actualizar producto: ' + (await res.text()));
    return await res.json();
  }

  // JSON (ideal para flags y precio_regular)
  const body = {};
  if (producto.nombre?.trim()) body.nombre = producto.nombre;
  if (producto.descripcion?.trim()) body.descripcion = producto.descripcion;

  if (producto.precio !== '' && producto.precio !== undefined && producto.precio !== null) {
    body.precio = Number(producto.precio);
  }
  if (producto.stock_minimo !== '' && producto.stock_minimo !== undefined && producto.stock_minimo !== null) {
    body.stock_minimo = Number(producto.stock_minimo);
  }
  if (producto.categoria_id !== '' && producto.categoria_id !== undefined && producto.categoria_id !== null) {
    body.categoria_id = Number(producto.categoria_id);
  }

  // ✅ flags y precio_regular
  if ('en_oferta' in producto) body.en_oferta = !!producto.en_oferta;
  if ('destacado' in producto) body.destacado = !!producto.destacado;
  if ('precio_regular' in producto && producto.precio_regular !== null && producto.precio_regular !== '') {
    body.precio_regular = Number(producto.precio_regular);
  }

  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Error al actualizar producto: ' + (await res.text()));
  return await res.json();
};

export const deleteProducto = async (id) => {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar producto');
};

/**
 * Actualiza un campo booleano (destacado / en_oferta)
 * Ej: updateCampoProducto(id, { destacado: true })
 *     updateCampoProducto(id, { en_oferta: false })
 */
export const updateCampoProducto = async (id, campos) => {
  const campo = Object.prototype.hasOwnProperty.call(campos, 'destacado') ? 'destacado' : 'en_oferta';
  const valor = campos[campo];

  const res = await fetch(`${API_URL}/${id}/${campo}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [campo]: valor }),
  });
  if (!res.ok) throw new Error(`Error al actualizar ${campo}: ` + (await res.text()));
  return await res.json();
};

/* =========================
   📸 Galería de imágenes
   ========================= */
export const getImagenesProducto = async (id) => {
  const res = await fetch(`${API_URL}/${id}/imagenes?bust=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener imágenes del producto');
  const arr = await res.json();
  return Array.isArray(arr)
    ? arr.map((x, i) => (typeof x === 'string' ? { id: i, url: x, es_principal: false, orden: i } : x))
    : [];
};

export const addImagenesProducto = async (id, files) => {
  const formData = new FormData();
  [...files].forEach((f) => formData.append('imagenes', f));

  const res = await fetch(`${API_URL}/${id}/imagenes`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(await res.text());

  const json = await res.json();
  const arr = Array.isArray(json?.result) ? json.result : Array.isArray(json) ? json : [];
  return arr.map((x, i) => (typeof x === 'string' ? { id: i, url: x, es_principal: false, orden: i } : x));
};

export const deleteImagenProducto = async (id, imgIdOrUrl) => {
  const encoded = encodeURIComponent(String(imgIdOrUrl));
  const res = await fetch(`${API_URL}/${id}/imagenes/${encoded}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());

  const json = await res.json();
  const arr = Array.isArray(json?.result) ? json.result : [];
  return arr.map((x, i) => (typeof x === 'string' ? { id: i, url: x, es_principal: false, orden: i } : x));
};

export default {
  getProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
  updateCampoProducto,
  getImagenesProducto,
  addImagenesProducto,
  deleteImagenProducto,
};
