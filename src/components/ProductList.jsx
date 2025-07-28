import { useEffect, useState } from 'react';;
import { motion as Motion} from 'framer-motion';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { updateProducto } from '../services/productService'; // asegúrate de importar esto

const API_URL = 'http://localhost:3001';

export default function ProductList({ productos, onEdit, onDelete, cargarProductos }) {
  const [imagenModalIndex, setImagenModalIndex] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editableProducto, setEditableProducto] = useState(null);

  const [categorias, setCategorias] = useState([]);

useEffect(() => {
  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/categorias');
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  cargarCategorias();
}, []);

  const getImageUrl = (imagen_url) => {
    if (!imagen_url) return '/img/no-image.png';
    if (imagen_url.startsWith('http')) return imagen_url;
    return `${API_URL}${imagen_url.startsWith('/') ? '' : '/'}${imagen_url}`;
  };

  const cerrarModal = () => {
    setImagenModalIndex(null);
    setConfirmDelete(false);
    setEditableProducto(null);
  };

  const mostrarAnterior = (e) => {
    e.stopPropagation();
    setImagenModalIndex((prev) =>
      prev > 0 ? prev - 1 : productos.length - 1
    );
    setConfirmDelete(false);
  };

  const mostrarSiguiente = (e) => {
    e.stopPropagation();
    setImagenModalIndex((prev) => (prev + 1) % productos.length);
    setConfirmDelete(false);
  };

  const productoActual =
    imagenModalIndex !== null ? productos[imagenModalIndex] : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableProducto((prev) => ({ ...prev, [name]: value }));
  };

  const iniciarEdicion = () => {
    setEditableProducto({ ...productoActual });
  };

const guardarCambios = async () => {
  try {
    const data = {
      ...editableProducto,
      imagenFile: editableProducto.imagenFile,
    };

    await updateProducto(productoActual.id, data);
    await cargarProductos(); // <-- recarga la lista
    toast.success(
      <span className="flex items-center gap-2">
        🐼 Producto actualizado con éxito
      </span>
    );

    cerrarModal();
  } catch (error) {
    console.error('Error al actualizar desde modal:', error);
    toast.error(
      <span className="flex items-center gap-2">
        😿 Error al actualizar producto
      </span>
    );
  }
};

  const confirmarEliminacion = () => {
    setConfirmDelete(true);
  };

  const ejecutarEliminacion = () => {
    onDelete(productoActual.id);
    cerrarModal();
  };

  return (
    <>
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-200 text-center">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Descripción</th>
            <th className="p-2 border">Precio</th>
            <th className="p-2 border">Stock</th>
            <th className="p-2 border">Categoría</th>
            <th className="p-2 border">Imagen</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>

        <Motion.tbody
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {productos.map((producto, index) => (
            <tr key={producto.id} className="text-center border-t">
              <td className="p-2 border">{producto.nombre}</td>
              <td className="p-2 border">{producto.descripcion}</td>
              <td className="p-2 border">S/ {Number(producto.precio || 0).toFixed(2)}</td>
              <td className="p-2 border">{producto.stock}</td>
              <td className="p-2 border">{producto.categoria_nombre}</td>
              <td className="p-2 border">
                {producto.imagen_url ? (
                  <img
                    src={getImageUrl(producto.imagen_url)}
                    alt={producto.nombre}
                    onClick={() => setImagenModalIndex(index)}
                    className="w-16 h-16 object-cover mx-auto rounded-md shadow cursor-pointer hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <span className="text-gray-400 italic">Sin imagen</span>
                )}
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => onEdit(producto)}
                  className="bg-yellow-400 px-2 py-1 rounded mr-2 flex items-center justify-center gap-1"
                >
                  <FaEdit /> Editar
                </button>
                <button
                  onClick={() => onDelete(producto.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded flex items-center justify-center gap-1"
                >
                  <FaTrashAlt /> Eliminar
                </button>
              </td>
            </tr>
          ))}
        </Motion.tbody>
      </table>

      {/* Modal */}
      {productoActual && productoActual.imagen_url && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={cerrarModal}
        >
          <div
            className="relative max-w-4xl max-h-[90%] bg-white rounded-lg overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center p-4">
              <img
                src={getImageUrl(productoActual.imagen_url)}
                alt={productoActual.nombre}
                className="max-h-[60vh] object-contain rounded"
              />
              <div className="mt-4 text-center space-y-2">
                {editableProducto ? (
                  <>
                    <input
                      name="nombre"
                      value={editableProducto.nombre}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <textarea
                      name="descripcion"
                      value={editableProducto.descripcion}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      name="precio"
                      type="number"
                      value={editableProducto.precio}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      name="stock"
                      type="number"
                      value={editableProducto.stock}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <select
                    name="categoria_id"
                    value={editableProducto.categoria_id}
                    onChange={handleChange}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Seleccione una categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditableProducto((prev) => ({
                          ...prev,
                          imagenFile: e.target.files[0],
                          imagenPreview: URL.createObjectURL(e.target.files[0]),
                        }))
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                    {editableProducto.imagenPreview && (
                      <img
                        src={editableProducto.imagenPreview}
                        alt="Previsualización"
                        className="max-h-48 object-contain mx-auto mt-2 rounded shadow"
                      />
                    )}

                    <div className="flex gap-4 justify-center mt-2">
                      <button
                        onClick={guardarCambios}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cerrarModal}
                        className="bg-gray-300 px-4 py-2 rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold">{productoActual.nombre}</h2>
                    <p className="text-gray-700">{productoActual.descripcion}</p>
                    <p className="text-gray-800 font-medium">Precio: S/ {Number(productoActual.precio || 0).toFixed(2)}</p>
                    <p className="text-gray-600">Stock: {productoActual.stock}</p>
                    <p className="text-gray-500 italic">Categoría: {productoActual.categoria_nombre}</p>

                    {/* Botones */}
                    <div className="mt-4 flex justify-center gap-4">
                      <button
                        onClick={iniciarEdicion}
                        className="bg-yellow-400 hover:bg-yellow-300 px-4 py-2 rounded"
                      >
                        Editar
                      </button>
                      {!confirmDelete ? (
                        <button
                          onClick={confirmarEliminacion}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        >
                          Eliminar
                        </button>
                      ) : (
                        <button
                          onClick={ejecutarEliminacion}
                          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
                        >
                          Confirmar eliminación
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={cerrarModal}
              className="absolute top-2 right-2 bg-gray-200 hover:bg-white text-black px-3 py-1 rounded shadow"
            >
              ✕
            </button>

            {/* Navegación */}
            <button
              onClick={mostrarAnterior}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white text-black px-3 py-1 rounded shadow"
            >
              ←
            </button>
            <button
              onClick={mostrarSiguiente}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black px-3 py-1 rounded shadow"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
