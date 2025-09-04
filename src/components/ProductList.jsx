// src/components/ProductList.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaImages, FaTrash, FaUpload, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  updateProducto,
  updateCampoProducto,
  addImagenesProducto,
} from '../services/productService';
import axios from 'axios';

const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_APP}/api`;

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
       <rect width="100%" height="100%" fill="#f3f4f6"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="Arial" font-size="14" fill="#9ca3af">Sin imagen</text>
     </svg>`
  );

const uniqByUrl = (arr) => {
  const seen = new Set();
  return (arr || []).filter((it) => {
    const url = (typeof it === 'string' ? it : it?.url) || '';
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};

const toPublicPath = (s) => {
  if (!s || typeof s !== 'string') return '';
  const norm = s.replace(/\\/g, '/');
  const i = norm.toLowerCase().indexOf('/uploads/');
  return i >= 0 ? norm.slice(i) : norm.startsWith('/') ? norm : `/${norm}`;
};

const isLockedImage = (item, product) => {
  if (item?.es_principal) return true;
  const a = toPublicPath(item?.url || '');
  const b = toPublicPath(product?.imagen_url || '');
  return a && b && a === b;
};

function toFullUrl(raw) {
  if (!raw) return FALLBACK_IMG;
  let s = typeof raw === 'string' ? raw : raw?.url ?? raw?.src ?? '';
  if (!s) return FALLBACK_IMG;
  s = s.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(s)) return s;

  const upIdx = s.toLowerCase().indexOf('/uploads/');
  if (upIdx >= 0) {
    const rel = s.slice(upIdx);
    return `${API_APP}${rel}`;
  }
  if (s.startsWith('/')) return `${API_APP}${s}`;
  return `${API_APP}/uploads/${s}`;
}
const getImageUrl = (u) => toFullUrl(u);

// -------------------- helpers oferta --------------------
const pct = (regular, oferta) => {
  const r = Number(regular), o = Number(oferta);
  if (!(r > 0) || !(o > 0) || o >= r) return 0;
  return Math.round(((r - o) / r) * 100);
};
const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

// ========================================================

export default function ProductList({ productos, onEdit, onDelete, cargarProductos }) {
  const [imagenModalIndex, setImagenModalIndex] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editableProducto, setEditableProducto] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [modalReponer, setModalReponer] = useState(null);
  const [cantidadReponer, setCantidadReponer] = useState(0);
  const [productoResaltado, setProductoResaltado] = useState(null);

  // Galería
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const galleryInputRef = useRef(null);

  // -------- Oferta modal --------
  const [offerModal, setOfferModal] = useState(null); // producto o null
  const [offerRegular, setOfferRegular] = useState(0);
  const [offerPrice, setOfferPrice] = useState(0);

  const offerDiscount = useMemo(() => pct(offerRegular, offerPrice), [offerRegular, offerPrice]);
  const offerSavings = useMemo(() => Math.max(offerRegular - offerPrice, 0), [offerRegular, offerPrice]);

  // ------------------------------------------------------

  const toggleCampo = async (producto, campo) => {
    try {
      const nuevoValor = !producto[campo];
      await updateCampoProducto(producto.id, { [campo]: nuevoValor });
      toast.success(`${campo === 'destacado' ? '⭐' : '💥'} ${campo} actualizado`);
      cargarProductos();
    } catch (error) {
      console.error(`Error actualizando ${campo}:`, error);
      toast.error(`❌ No se pudo actualizar ${campo}`);
    }
  };

  // activar/desactivar oferta con modal
  const handleOfertaToggle = async (producto) => {
    if (!producto.en_oferta) {
      // -> activar: abrir modal
      const regular = Number(producto.precio_regular) > 0 ? Number(producto.precio_regular) : Number(producto.precio);
      setOfferModal(producto);
      setOfferRegular(Number(regular.toFixed(2)));
      // sugerimos 15% off por defecto
      const sugerido = Math.max(regular * 0.85, 0.1);
      setOfferPrice(Number(sugerido.toFixed(2)));
      return;
    }

    // -> desactivar: confirmar y restaurar precio
    const ok = window.confirm(
      `Quitar oferta para “${producto.nombre}”? Se restaurará el precio regular (${fmt(producto.precio_regular)}).`
    );
    if (!ok) return;

    try {
      await updateProducto(producto.id, {
        en_oferta: false,
        precio: Number(producto.precio_regular || producto.precio),
      });
      toast.info('💤 Oferta desactivada y precio restaurado');
      await cargarProductos();
    } catch (err) {
      console.error(err);
      toast.error('❌ No se pudo desactivar la oferta');
    }
  };

  const applyOffer = async () => {
    if (!offerModal) return;
    const pr = Number(offerRegular);
    const po = Number(offerPrice);

    if (!(pr > 0)) return toast.warn('Ingresa un precio regular válido');
    if (!(po > 0)) return toast.warn('Ingresa un precio de oferta válido');
    if (po >= pr) return toast.warn('El precio de oferta debe ser menor al precio regular');

    try {
      await updateProducto(offerModal.id, {
        precio_regular: pr,
        precio: po,
        en_oferta: true,
      });
      toast.success(`💥 Oferta aplicada: ${fmt(po)} (ahorras ${fmt(pr - po)} • ${pct(pr, po)}%)`);
      setOfferModal(null);
      await cargarProductos();
    } catch (err) {
      console.error(err);
      toast.error('❌ No se pudo aplicar la oferta');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/categorias`, { cache: 'no-store' });
        const data = await res.json();
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    })();
  }, []);

  const cerrarModal = () => {
    setImagenModalIndex(null);
    setConfirmDelete(false);
    setEditableProducto(null);
  };

  const mostrarAnterior = (e) => {
    e.stopPropagation();
    setImagenModalIndex((prev) => (prev > 0 ? prev - 1 : productos.length - 1));
    setConfirmDelete(false);
  };

  const mostrarSiguiente = (e) => {
    e.stopPropagation();
    setImagenModalIndex((prev) => (prev + 1) % productos.length);
    setConfirmDelete(false);
  };

  const productoActual = imagenModalIndex !== null ? productos[imagenModalIndex] : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableProducto((prev) => ({ ...prev, [name]: value }));
  };

  const iniciarEdicion = () => setEditableProducto({ ...productoActual });

  const guardarCambios = async () => {
    try {
      const data = { ...editableProducto, imagenFile: editableProducto.imagenFile };
      await updateProducto(productoActual.id, data);
      await cargarProductos();
      toast.success(<span className="flex items-center gap-2">🐼 Producto actualizado con éxito</span>);
      cerrarModal();
    } catch (error) {
      console.error('Error al actualizar desde modal:', error);
      toast.error(<span className="flex items-center gap-2">😿 Error al actualizar producto</span>);
    }
  };

  const confirmarEliminacion = () => setConfirmDelete(true);
  const ejecutarEliminacion = () => {
    onDelete(productoActual.id);
    cerrarModal();
  };

  const handleReponer = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/productos/${id}/reponer`,
        { cantidad: cantidadReponer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('✅ Stock actualizado correctamente');
      setProductoResaltado(id);
      setTimeout(() => setProductoResaltado(null), 2000);
      setModalReponer(null);
      setCantidadReponer(0);
      cargarProductos();
    } catch (error) {
      toast.error('❌ Error al reponer stock');
      console.error(error);
    }
  };

  // ===== Galería =====
  const openGallery = async (producto) => {
    setGalleryOpen(true);
    setGalleryProduct(producto);
    setGallery([]);
    setGalleryFiles([]);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/productos/${producto.id}/imagenes`, { cache: 'no-store' });
      const data = await res.json();
      setGallery(uniqByUrl(Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error('No se pudo cargar la galería');
      console.error(err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setGalleryProduct(null);
    setGallery([]);
    setGalleryFiles([]);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const onPickGalleryFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles(files);
  };

  const refreshGallery = async (productId) => {
    const res = await fetch(`${API_BASE}/productos/${productId}/imagenes`, { cache: 'no-store' });
    const data = await res.json();
    setGallery(uniqByUrl(Array.isArray(data) ? data : []));
  };

  const uploadGalleryFiles = async () => {
    if (!galleryProduct || galleryFiles.length === 0) {
      toast.info('Selecciona una o más imágenes');
      return;
    }
    setGalleryUploading(true);
    try {
      await addImagenesProducto(galleryProduct.id, galleryFiles);
      await refreshGallery(galleryProduct.id);
      setGalleryFiles([]);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      toast.success('📸 Imágenes agregadas');
    } catch (err) {
      console.error(err);
      toast.error('❌ No se pudieron subir las imágenes');
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryImage = async (item) => {
    if (!galleryProduct) return;
    if (isLockedImage(item, galleryProduct)) {
      toast.info('La imagen principal no se puede eliminar desde la galería. Cámbiala en “Editar producto”.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/productos/${galleryProduct.id}/imagenes/${item.id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await res.text());
      await refreshGallery(galleryProduct.id);
      toast.success('🗑️ Imagen eliminada');
    } catch (err) {
      console.error(err);
      toast.error('❌ No se pudo eliminar la imagen');
    }
  };

  return (
    <>
  {/* Desktop table */}
<div className="hidden md:block">
  <div className="mt-4 w-full overflow-x-auto rounded border bg-white">
    <table className="min-w-[920px] w-full border">
      <thead className="sticky top-0 z-10">
        <tr className="bg-gray-100 text-center border-b">
          <th className="p-2 border w-[220px]">Nombre</th>
          <th className="p-2 border w-[320px]">Descripción</th>
          <th className="p-2 border w-[120px]">Precio</th>
          <th className="p-2 border w-[110px]">Stock</th>
          <th className="p-2 border w-[160px]">Categoría</th>
          <th className="p-2 border w-[110px]">Imagen</th>
          <th className="p-2 border w-[140px]">Galería</th>
          <th className="p-2 border w-[70px]">⭐</th>
          <th className="p-2 border w-[70px]">💥</th>
          <th className="p-2 border w-[240px]">Acciones</th>
        </tr>
      </thead>

      <Motion.tbody
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {productos.map((producto, index) => {
          const enOferta = !!producto.en_oferta;
          const regular = Number(producto.precio_regular || producto.precio);
          const oferta = Number(producto.precio);
          const d = pct(regular, oferta);

          return (
            <tr
              key={producto.id}
              className={`text-center border-t hover:bg-gray-50 ${
                productoResaltado === producto.id ? 'bg-green-100 font-semibold' : ''
              }`}
            >
              {/* Nombre */}
              <td className="p-2 border text-left max-w-[220px]">
                <span className="block truncate" title={producto.nombre}>
                  {producto.nombre}
                </span>
              </td>

              {/* Descripción */}
              <td className="p-2 border text-left">
                <span className="block max-w-[320px] truncate" title={producto.descripcion}>
                  {producto.descripcion}
                </span>
              </td>

              {/* Precio con soporte de oferta */}
              <td className="p-2 border whitespace-nowrap">
                {enOferta ? (
                  <div className="inline-flex flex-col items-center gap-0.5 leading-tight">
                    <div className="font-bold text-purple-900">{fmt(oferta)}</div>
                    <div className="text-xs line-through text-gray-500">{fmt(regular)}</div>
                    {d > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold">
                        -{d}%
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="font-medium">{fmt(oferta)}</span>
                )}
              </td>

              {/* Stock */}
              <td className="p-2 border whitespace-nowrap">
                {producto.stock_actual ?? '—'}
                {producto.stock_actual !== null &&
                  producto.stock_actual <= producto.stock_minimo && (
                    <span
                      className="ml-2 inline-block text-red-600 font-bold"
                      title="Stock bajo"
                      aria-label="Stock bajo"
                    >
                      ⚠️
                    </span>
                  )}
              </td>

              {/* Categoría */}
              <td className="p-2 border">
                <span className="block max-w-[160px] truncate" title={producto.categoria_nombre}>
                  {producto.categoria_nombre}
                </span>
              </td>

              {/* Imagen principal */}
              <td className="p-2 border">
                <img
                  src={producto.imagen_url ? getImageUrl(producto.imagen_url) : FALLBACK_IMG}
                  alt={producto.nombre}
                  onClick={() => producto.imagen_url && setImagenModalIndex(index)}
                  className="w-16 h-16 object-cover mx-auto rounded-md shadow cursor-pointer hover:scale-105 transition-transform duration-200"
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                />
              </td>

              {/* Botón Galería */}
              <td className="p-2 border">
                <button
                  type="button"
                  onClick={() => openGallery(producto)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
                  title="Gestionar galería"
                  aria-label={`Gestionar galería de ${producto.nombre}`}
                >
                  <FaImages /> Gestionar
                </button>
              </td>

              {/* Destacado */}
              <td className="p-2 border">
                <input
                  type="checkbox"
                  checked={!!producto.destacado}
                  onChange={() => toggleCampo(producto, 'destacado')}
                  aria-label={`Marcar destacado ${producto.nombre}`}
                  title="Destacado"
                />
              </td>

              {/* Oferta */}
              <td className="p-2 border">
                <input
                  type="checkbox"
                  checked={!!producto.en_oferta}
                  onChange={() => handleOfertaToggle(producto)}
                  aria-label={`Marcar en oferta ${producto.nombre}`}
                  title="Oferta"
                />
              </td>

              {/* Acciones */}
              <td className="p-2 border">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(producto)}
                    className="bg-yellow-400 hover:bg-yellow-300 px-2 py-1 rounded flex items-center gap-1"
                    aria-label={`Editar ${producto.nombre}`}
                    title="Editar"
                  >
                    <FaEdit /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(producto.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1"
                    aria-label={`Eliminar ${producto.nombre}`}
                    title="Eliminar"
                  >
                    <FaTrashAlt /> Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalReponer(producto);
                      setCantidadReponer(0);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1"
                    aria-label={`Reponer stock de ${producto.nombre}`}
                    title="Reponer"
                  >
                    <FaPlusCircle /> Reponer
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </Motion.tbody>
    </table>
  </div>
</div>


{/* CARDS en móvil (optimizado y sin recortes) */}
<div className="md:hidden space-y-3">
  {productos.map((p) => {
    const regular = Number(p.precio_regular || p.precio);
    const oferta = Number(p.precio);
    const enOferta = !!p.en_oferta;
    const d = enOferta ? Math.round(((regular - oferta) / regular) * 100) : 0;

    return (
      <div key={p.id} className="bg-white rounded-xl shadow-sm p-3 w-full overflow-hidden">
        {/* fila superior: imagen + info */}
        <div className="grid grid-cols-[72px,1fr] gap-3">
          <img
            src={p.imagen_url ? getImageUrl(p.imagen_url) : FALLBACK_IMG}
            alt={p.nombre}
            onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
            className="w-[72px] h-[72px] rounded object-cover shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">{p.nombre}</div>
            <div className="text-xs text-gray-500 truncate">{p.categoria_nombre}</div>

            {/* precio */}
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              {enOferta ? (
                <>
                  <span className="font-bold text-purple-900">S/ {oferta.toFixed(2)}</span>
                  <span className="line-through text-gray-400 text-xs">S/ {regular.toFixed(2)}</span>
                  <span className="bg-pink-100 text-pink-700 text-[11px] px-1.5 py-0.5 rounded">-{d}%</span>
                </>
              ) : (
                <span className="font-medium">S/ {oferta.toFixed(2)}</span>
              )}
            </div>

            {/* acciones */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => onEdit(p)}
                className="px-2.5 py-1 rounded bg-yellow-400 text-white text-xs"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="px-2.5 py-1 rounded bg-red-500 text-white text-xs"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setModalReponer(p);
                  setCantidadReponer(0);
                }}
                className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs"
              >
                Reponer
              </button>
            </div>
          </div>
        </div>

        {/* toggles + stock */}
        <div className="mt-3 pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!p.destacado}
                onChange={() => toggleCampo(p, 'destacado')}
              />
              <span className="text-sm">Destacado</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!p.en_oferta}
                onChange={() => handleOfertaToggle(p)}
              />
              <span className="text-sm">Oferta</span>
            </label>
          </div>

          <div className="text-sm text-gray-600 sm:text-right">
            Stock: <span className="font-medium">{p.stock_actual ?? '—'}</span>
          </div>
        </div>
      </div>
    );
  })}
</div>


      {/* Modal: Reponer */}
      {modalReponer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button type="button" onClick={() => setModalReponer(null)} className="absolute top-2 right-2 text-gray-600" title="Cerrar">
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">Reponer stock de "{modalReponer.nombre}"</h3>
            <input
              type="number"
              className="w-full p-2 border rounded mb-4"
              placeholder="Cantidad a reponer"
              value={cantidadReponer}
              onChange={(e) => setCantidadReponer(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalReponer(null)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                Cancelar
              </button>
              <button type="button" onClick={() => handleReponer(modalReponer.id)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Oferta */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3" onClick={() => setOfferModal(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border">
                <img
                  src={getImageUrl(offerModal.imagen_url)}
                  alt={offerModal.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{offerModal.nombre}</h3>
                <p className="text-sm text-gray-500">Configura el precio de la oferta</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio regular</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerRegular}
                  onChange={(e) => setOfferRegular(Number(e.target.value))}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio de oferta</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[10, 15, 20, 25, 30].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOfferPrice(Number((offerRegular * (1 - p / 100)).toFixed(2)))}
                      className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50"
                    >
                      -{p}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span>Ahorro</span>
                  <span className="font-semibold">{fmt(offerSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento</span>
                  <span className="font-semibold">{offerDiscount}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setOfferModal(null)}>
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
                onClick={applyOffer}
              >
                Aplicar oferta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal info/edición producto (se mantiene igual) */}
      {productoActual && (productoActual.imagen_url || (productoActual.imagenes && productoActual.imagenes.length)) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={cerrarModal}>
          <div className="relative max-w-4xl max-h-[90%] bg-white rounded-lg overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center p-4">
              <img
                src={toFullUrl(productoActual.imagenes?.[0]?.url ?? productoActual.imagen_url)}
                alt={productoActual.nombre}
                className="max-h-[60vh] object-contain rounded"
                onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
              />

              <div className="mt-4 text-center space-y-2">
                {editableProducto ? (
                  <>
                    <input name="nombre" value={editableProducto.nombre} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                    <textarea name="descripcion" value={editableProducto.descripcion} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                    <input name="precio" type="number" value={editableProducto.precio} onChange={handleChange} className="border rounded px-2 py-1 w-full" />

                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Stock actual</label>
                      <input type="number" value={editableProducto.stock_actual} readOnly disabled className="border rounded px-2 py-1 w-full bg-gray-100 cursor-not-allowed select-none" />
                      <small className="text-gray-500">El stock se actualiza desde <strong>“Reponer”</strong>.</small>
                    </div>

                    <input name="stock_minimo" type="number" value={editableProducto.stock_minimo} onChange={handleChange} className="border rounded px-2 py-1 w-full" />

                    <select name="categoria_id" value={editableProducto.categoria_id} onChange={handleChange} className="border rounded px-2 py-1 w-full">
                      <option value="">Seleccione una categoría</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
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
                      <img src={editableProducto.imagenPreview} alt="Previsualización" className="max-h-48 object-contain mx-auto mt-2 rounded shadow" />
                    )}

                    <div className="flex gap-4 justify-center mt-2">
                      <button type="button" onClick={guardarCambios} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Guardar</button>
                      <button type="button" onClick={cerrarModal} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold">{productoActual.nombre}</h2>
                    <p className="text-gray-700">{productoActual.descripcion}</p>
                    <p className="text-gray-800 font-medium">Precio: {fmt(productoActual.precio)}</p>
                    {productoActual.en_oferta && (
                      <p className="text-sm text-pink-600">
                        Precio regular: <span className="line-through text-gray-500">{fmt(productoActual.precio_regular)}</span> •
                        Ahorro {pct(productoActual.precio_regular, productoActual.precio)}%
                      </p>
                    )}
                    <p className="text-gray-600">Stock actual: {productoActual.stock_actual}</p>
                    <p className="text-gray-600">Stock mínimo: {productoActual.stock_minimo}</p>
                    <p className="text-gray-500 italic">Categoría: {productoActual.categoria_nombre}</p>

                    <div className="mt-4 flex justify-center gap-4">
                      <button type="button" onClick={iniciarEdicion} className="bg-yellow-400 hover:bg-yellow-300 px-4 py-2 rounded">Editar</button>
                      {!confirmDelete ? (
                        <button type="button" onClick={confirmarEliminacion} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Eliminar</button>
                      ) : (
                        <button type="button" onClick={ejecutarEliminacion} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded">Confirmar eliminación</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button type="button" onClick={cerrarModal} className="absolute top-2 right-2 bg-gray-200 hover:bg-white text-black px-3 py-1 rounded shadow" title="Cerrar">✕</button>
            <button type="button" onClick={mostrarAnterior} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white text-black px-3 py-1 rounded shadow" title="Anterior">←</button>
            <button type="button" onClick={mostrarSiguiente} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black px-3 py-1 rounded shadow" title="Siguiente">→</button>
          </div>
        </div>
      )}

      {/* Modal Galería */}
      {galleryOpen && galleryProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={closeGallery}>
          <div className="relative w-full max-w-3xl bg-white rounded-xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={closeGallery} className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200" title="Cerrar">
              <FaTimes />
            </button>

            <h3 className="text-xl font-bold mb-1">Galería: {galleryProduct.nombre}</h3>
            <p className="text-sm text-gray-500 mb-4">Agrega o elimina imágenes adicionales para este producto.</p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onPickGalleryFiles}
                className="block w-full sm:w-auto"
              />
              <button
                type="button"
                onClick={uploadGalleryFiles}
                disabled={galleryUploading || galleryFiles.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60"
              >
                <FaUpload />
                {galleryUploading ? 'Subiendo...' : 'Subir seleccionadas'}
              </button>
              {galleryFiles.length > 0 && <span className="text-sm text-gray-600">{galleryFiles.length} archivo(s) listo(s)</span>}
            </div>

            <div className="min-h-[120px]">
              {galleryLoading ? (
                <div className="grid place-items-center py-8">
                  <div className="w-10 h-10 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                </div>
              ) : gallery.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Sin imágenes en la galería</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((item) => {
                    const locked = isLockedImage(item, galleryProduct);
                    return (
                      <div key={item.id} className="relative rounded-lg overflow-hidden border shadow-sm group">
                        <img
                          src={toFullUrl(item.url)}
                          alt={`img-${item.id}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                        />
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(item)}
                            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-red-600 hover:bg-white"
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        )}
                        {locked && (
                          <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-800/70 text-white rounded">
                            Principal
                          </span>
                        )}
                      </div>



                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={closeGallery} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
