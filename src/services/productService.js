// src/services/productService.js

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


export async function createProducto(data) {
  const formData = new FormData();

  formData.append('nombre', data.nombre);
  formData.append('descripcion', data.descripcion);
  formData.append('precio', data.precio);
  formData.append('stock', data.stock);
  formData.append('categoria_id', data.categoria_id); // este debe ser el id, no el nombre
  if (data.imagenFile) {
    formData.append('imagen', data.imagenFile);
  }

  const response = await fetch('http://localhost:3001/api/productos', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Error al crear producto: ' + errorText);
  }

  return await response.json();
}


export const updateProducto = async (id, producto) => {
  try {
    const formData = new FormData();

    // Agrega solo los campos que tengan valor (evita "" o undefined)
    if (producto.nombre?.trim()) {
      formData.append('nombre', producto.nombre);
    }
    if (producto.descripcion?.trim()) {
      formData.append('descripcion', producto.descripcion);
    }
    if (producto.precio !== '' && producto.precio !== undefined && producto.precio !== null) {
      formData.append('precio', producto.precio);
    }
    if (producto.stock !== '' && producto.stock !== undefined && producto.stock !== null) {
      formData.append('stock', producto.stock);
    }
    if (producto.categoria_id !== '' && producto.categoria_id !== undefined && producto.categoria_id !== null) {
      formData.append('categoria_id', producto.categoria_id);
    }

    // Si hay nueva imagen, se adjunta
    if (producto.imagenFile) {
      formData.append('imagen', producto.imagenFile);
    }

    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!res.ok) throw new Error('Error al actualizar producto');
    return await res.json();
  } catch (error) {
    console.error('updateProducto:', error);
    throw error;
  }
};


export const deleteProducto = async (id) => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar producto');
  } catch (error) {
    console.error('deleteProducto:', error);
    throw error;
  }
};

export default {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
};
