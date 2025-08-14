// src/components/ProductForm.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function ProductForm({ onSubmit, productoActual, setProductoActual }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock_actual: '',
    stock_minimo: '',
    categoria_id: '',
    imagen_url: ''
  });

  const [file, setFile] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const isEdit = !!productoActual;

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
        stock_actual: productoActual.stock_actual ?? '',
        stock_minimo: productoActual.stock_minimo ?? '',
        categoria_id: productoActual.categoria_id || '',
        imagen_url: productoActual.imagen_url || ''
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock_actual: '',
        stock_minimo: '',
        categoria_id: '',
        imagen_url: ''
      });
    }
    setFile(null);
  }, [productoActual]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // En modo edición, no permitir cambios del stock desde este formulario
    if (isEdit && name === 'stock_actual') return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !productoActual && (
        !formData.nombre.trim() ||
        !formData.descripcion.trim() ||
        !formData.precio ||
        !formData.stock_actual ||
        !formData.stock_minimo ||
        !formData.categoria_id
      )
    ) {
      toast.warn('🐵 Todos los campos son obligatorios');
      return;
    }

    // Construir payload
    const dataToSend = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: formData.precio,
      stock_minimo: formData.stock_minimo,
      categoria_id: formData.categoria_id,
      imagenFile: file,
    };

    // Solo incluir stock_actual al CREAR
    if (!isEdit) {
      dataToSend.stock_actual = formData.stock_actual;
    }

    try {
      await onSubmit(dataToSend, productoActual?.id);
      toast.success(`🐼 Producto ${productoActual ? 'actualizado' : 'creado'} con éxito`);

      // Reset
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock_actual: '',
        stock_minimo: '',
        categoria_id: '',
        imagen_url: ''
      });
      setFile(null);
      setProductoActual(null);
    } catch (error) {
      toast.error('😵‍💫 Ocurrió un error al guardar el producto');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 shadow rounded mb-6">
      <input
        type="text"
        name="nombre"
        placeholder="Nombre"
        value={formData.nombre}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      <textarea
        name="descripcion"
        placeholder="Descripción"
        value={formData.descripcion}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      <input
        type="number"
        name="precio"
        placeholder="Precio"
        value={formData.precio}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        step="0.01"
        required
      />

      {/* STOCK: visible siempre, editable solo al crear */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Stock actual</label>
        <input
          type="number"
          name="stock_actual"
          placeholder="Stock actual"
          value={formData.stock_actual}
          onChange={handleChange}
          className={`w-full border p-2 rounded ${isEdit ? 'bg-gray-100 cursor-not-allowed select-none' : ''}`}
          readOnly={isEdit}
          disabled={isEdit}
          required={!isEdit}
        />
        {isEdit && (
          <small className="text-gray-500">
            El stock se actualiza desde <strong>“Reponer”</strong> en la tabla.
          </small>
        )}
      </div>

      <input
        type="number"
        name="stock_minimo"
        placeholder="Stock mínimo"
        value={formData.stock_minimo}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      <select
        name="categoria_id"
        value={formData.categoria_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Seleccione una categoría</option>
        {categorias.map(categoria => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nombre}
          </option>
        ))}
      </select>

      <input
        type="file"
        name="imagen"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full border p-2 rounded"
      />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        {isEdit ? 'Actualizar' : 'Agregar'} Producto
      </button>
    </form>
  );
}
