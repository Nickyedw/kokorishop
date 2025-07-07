// src/pages/ProductAdmin.jsx
import React, { useEffect, useState } from 'react';
import ProductForm from '../components/ProductForm';
import ProductList from '../components/ProductList';
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
} from '../services/productService';

export default function ProductAdmin() {
  const [productos, setProductos] = useState([]);
  const [productoActual, setProductoActual] = useState(null);

  // Cargar productos desde el backend
  const cargarProductos = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  // Guardar producto (crear o actualizar)
  const handleSubmit = async (formValues) => {
    try {
      const formData = new FormData();
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      if (productoActual) {
        await updateProducto(productoActual.id, formData);
      } else {
        await createProducto(formData);
      }

      await cargarProductos();
      setProductoActual(null);
    } catch (error) {
      console.error('Error al guardar producto:', error);
    }
  };

  // Eliminar producto
  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteProducto(id);
        await cargarProductos();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Gestión de Productos</h2>

      <ProductForm
        onSubmit={handleSubmit}
        productoActual={productoActual}
        setProductoActual={setProductoActual}
      />

      <ProductList
        productos={productos}
        onEdit={setProductoActual}
        onDelete={handleDelete}
      />
    </div>
  );
}
