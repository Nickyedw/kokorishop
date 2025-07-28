// src/components/ProductForm.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa'; // Íconos kawaii

export default function ProductForm({ onSubmit, productoActual, setProductoActual }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria_id: '',
    imagen_url: ''
  });

  const [file, setFile] = useState(null);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/categorias')
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error('Error al cargar categorías:', err));
  }, []);

  useEffect(() => {
    if (productoActual) {
      setFormData({
        nombre: productoActual.nombre || '',
        descripcion: productoActual.descripcion || '',
        precio: productoActual.precio || '',
        stock: productoActual.stock || '',
        categoria_id: productoActual.categoria_id || '',
        imagen_url: productoActual.imagen_url || ''
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoria_id: '',
        imagen_url: ''
      });
    }
    setFile(null); // Reiniciar archivo seleccionado
  }, [productoActual]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !productoActual && (
      !formData.nombre.trim() ||
      !formData.descripcion.trim() ||
      !formData.precio ||
      !formData.stock ||
      !formData.categoria_id
    )
  ) {
    toast.warn(
      <span className="flex items-center gap-2">
        🐵 Todos los campos son obligatorios
      </span>
    );
    return;
  }

  const dataToSend = {
    nombre: formData.nombre,
    descripcion: formData.descripcion,
    precio: formData.precio,
    stock: formData.stock,
    categoria_id: formData.categoria_id,
    imagenFile: file,
  };

  try {
    await onSubmit(dataToSend, productoActual?.id);

    toast.success(
      <span className="flex items-center gap-2">
        🐼 Producto {productoActual ? 'actualizado' : 'creado'} con éxito
      </span>
    );

    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria_id: '',
      imagen_url: ''
    });
    setFile(null);
    setProductoActual(null);
  } catch (error) {
    toast.error(
      <span className="flex items-center gap-2">
        😵‍💫 Ocurrió un error al guardar el producto
      </span>
    );
    console.error(error);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 shadow rounded mb-6">
      <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} className="w-full border p-2 rounded" required />
      <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} className="w-full border p-2 rounded" required />
      <input type="number" name="precio" placeholder="Precio" value={formData.precio} onChange={handleChange} className="w-full border p-2 rounded" required />
      <input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} className="w-full border p-2 rounded" required />

      <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} className="w-full border p-2 rounded" required>
        <option value="">Seleccione una categoría</option>
        {categorias.map(categoria => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nombre}
          </option>
        ))}
      </select>

      <input type="file" name="imagen" accept="image/*" onChange={handleFileChange} className="w-full border p-2 rounded" />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        {productoActual ? 'Actualizar' : 'Agregar'} Producto
      </button>
    </form>
  );
}
