//src/services/productService.js
const API_URL = 'http://localhost:3001/api/productos';

export const getProductos = async () => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al obtener productos');
    return await res.json();
  } catch (error) {
    console.error('getProductos:', error);
    throw error;
  }
};

export const createProducto = async (producto) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  return await res.json();
};

export const updateProducto = async (id, producto) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  return await res.json();
};

export const deleteProducto = async (id) => {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
};
