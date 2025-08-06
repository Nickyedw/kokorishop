// src/pages/ProductAdmin.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { motion as Motion } from 'framer-motion';
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
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [alertaStockBajo, setAlertaStockBajo] = useState(false);

  const cargarProductos = async () => {
    try {
      setErrorMsg('');
      const lista = await getProductos();
      setProductos(lista);

      // Detectar productos con stock bajo
      const productosConStockBajo = lista.filter(p => p.stock_actual <= p.stock_minimo);
      setAlertaStockBajo(productosConStockBajo.length > 0);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setErrorMsg('No se pudo cargar la lista de productos.');
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleSubmit = async (formData, id) => {
    try {
      setErrorMsg('');
      if (id) {
        await updateProducto(id, formData);
        toast.success('Producto actualizado con éxito');
      } else {
        await createProducto(formData);
        toast.success('Producto creado con éxito');
      }
      await cargarProductos();
      setProductoActual(null);
      setMostrarModal(false);
    } catch (err) {
      console.error('Error guardando producto:', err);
      setErrorMsg(err.message || 'Error al guardar el producto.');
      toast.error('❌ Error al guardar producto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('🧹 ¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProducto(id);
      toast.success('🧼 Producto eliminado correctamente');
      await cargarProductos();
    } catch (err) {
      toast.error('😿 No se pudo eliminar el producto');
      console.error('Error eliminando producto:', err);
    }
  };

  const handleAgregar = () => {
    setProductoActual(null);
    setMostrarModal(true);
  };

  const handleEditar = (producto) => {
    setProductoActual(producto);
    setMostrarModal(true);
  };

  const productosFiltrados = productos.filter((producto) => {
    const termino = busqueda.toLowerCase();
    return (
      producto.nombre.toLowerCase().includes(termino) ||
      producto.descripcion.toLowerCase().includes(termino) ||
      (producto.categoria_nombre?.toLowerCase().includes(termino))
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      <h2 className="text-3xl font-bold mb-6">Gestión de Productos</h2>

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {errorMsg}
        </div>
      )}

      {alertaStockBajo && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 px-4 py-2 rounded mb-4">
          ⚠️ Algunos productos tienen <strong>stock bajo</strong>. ¡Revisa y repón inventario!
        </div>
      )}

      <input
        type="text"
        placeholder="🔍 Buscar por nombre, descripción o categoría..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full mb-4 border p-2 rounded shadow-sm"
      />

      {mostrarModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setMostrarModal(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-lg w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {productoActual ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <ProductForm
              onSubmit={handleSubmit}
              productoActual={productoActual}
              setProductoActual={setProductoActual}
            />
            <button
              onClick={() => setMostrarModal(false)}
              className="mt-2 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ProductList
        productos={productosFiltrados}
        onEdit={handleEditar}
        onDelete={handleDelete}
        cargarProductos={cargarProductos}
      />

      <Motion.button
        onClick={handleAgregar}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-full text-2xl z-50 shadow-lg"
        title="Agregar nuevo producto"
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 0 rgba(0,0,0,0)',
            '0 0 20px rgba(34,197,94,0.5)',
            '0 0 0 rgba(0,0,0,0)'
          ]
        }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: 2
        }}
      >
        ➕
      </Motion.button>
    </div>
  );
}
