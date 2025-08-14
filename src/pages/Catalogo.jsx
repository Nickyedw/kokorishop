import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { FaSearch, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import MiniCart from '../components/MiniCart';

const Catalogo = () => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/categorias');
        const data = await res.json();
        setCategorias(data);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };

    cargarCategorias();
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const url = categoriaSeleccionada
          ? `http://localhost:3001/api/productos/categoria/${categoriaSeleccionada}`
          : 'http://localhost:3001/api/productos';

        const res = await fetch(url);
        const data = await res.json();
        setProductos(data);
      } catch (err) {
        console.error('Error al cargar productos:', err);
      }
    };

    cargarProductos();
  }, [categoriaSeleccionada]);

  const productosFiltrados = productos.filter((p) => {
    const termino = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(termino) ||
      p.descripcion.toLowerCase().includes(termino) ||
      (p.categoria_nombre?.toLowerCase().includes(termino))
    );
  });

  return (
    <div className="min-h-screen bg-purple-900 text-white px-6 py-6">
      <h1 className="text-3xl font-bold mb-4 text-center">🛒 Catálogo de Productos</h1>

      {/* Filtro por categoría */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <select
          className="text-purple-900 px-4 py-2 rounded-full"
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        >
          <option value="">📦 Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>

        {/* Buscador */}
        <div className="relative w-full sm:w-1/2">
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-4 py-2 rounded-full text-purple-900"
          />
          <FaSearch className="absolute top-3 right-4 text-purple-600" />
        </div>
      </div>

      {/* Lista de productos */}
      {productosFiltrados.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {productosFiltrados.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      ) : (
        <p className="text-center text-pink-200 mt-10">😢 No se encontraron productos.</p>
      )}

      {/* Botón flotante para volver al Home con animación */}
      <Motion.button
        onClick={() => navigate('/')}
        className="fixed bottom-6 left-6 bg-pink-500 hover:bg-pink-600 text-white px-5 py-4 rounded-full shadow-lg flex items-center justify-center text-xl z-50"
        title="Regresar a la tienda"
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 0 rgba(0,0,0,0)',
            '0 0 20px rgba(236,72,153,0.5)',
            '0 0 0 rgba(0,0,0,0)'
          ]
        }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: 2
        }}
      >
        <FaHome />
      </Motion.button>

      {/* MiniCart reutilizable */}
      <MiniCart cartPath="/Cart" checkoutMode="query" />
    </div>
  );
};

export default Catalogo;
