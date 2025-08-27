// src/components/ProductForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  createProducto,
  updateProducto,
  getImagenesProducto, // read-only
} from '../services/productService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const publicUrl = (u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`);

// helpers oferta
const pct = (regular, oferta) => {
  const r = Number(regular), o = Number(oferta);
  if (!(r > 0) || !(o > 0) || o >= r) return 0;
  return Math.round(((r - o) / r) * 100);
};
const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

export default function ProductForm({ productoEdit, onSaved, categorias = [] }) {
  const isEdit = Boolean(productoEdit?.id);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    // precio aquí representa el precio ACTUAL del producto (oferta si está en_oferta, sino regular)
    precio: '',
    // oferta
    en_oferta: false,
    precio_regular: '', // solo tiene sentido cuando en_oferta=true
    // stock
    stock_actual: '',
    stock_minimo: 1,
    categoria_id: '',
    imagenFile: null, // principal
  });

  const [submitting, setSubmitting] = useState(false);

  // Galería (solo lectura)
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  /* 1) Sincroniza el formulario cuando cambia productoEdit */
  useEffect(() => {
    setForm({
      nombre: productoEdit?.nombre ?? '',
      descripcion: productoEdit?.descripcion ?? '',
      precio: productoEdit?.precio ?? '',
      en_oferta: !!productoEdit?.en_oferta,
      precio_regular:
        productoEdit?.precio_regular ?? (productoEdit?.en_oferta ? productoEdit?.precio_regular : ''), // si no hay, queda vacío
      stock_actual: productoEdit?.stock_actual ?? '',
      stock_minimo: productoEdit?.stock_minimo ?? 1,
      categoria_id: productoEdit?.categoria_id ?? '',
      imagenFile: null,
    });

    setGallery([]);
  }, [productoEdit]);

  /* 2) Carga la galería SOLO lectura cuando hay id */
  useEffect(() => {
    if (!productoEdit?.id) return;
    let abort = false;
    (async () => {
      try {
        setLoadingGallery(true);
        const imgs = await getImagenesProducto(productoEdit.id);
        if (!abort) {
          const urls = Array.isArray(imgs) ? imgs.map((x) => (x?.url ?? x)) : [];
          setGallery(urls);
        }
      } catch {
        if (!abort) setGallery([]);
      } finally {
        if (!abort) setLoadingGallery(false);
      }
    })();
    return () => { abort = true; };
  }, [productoEdit?.id]);

  /* Derivados de oferta */
  const descuentoPct = useMemo(() => pct(form.precio_regular, form.precio), [form.precio_regular, form.precio]);
  const ahorro = useMemo(() => Math.max(Number(form.precio_regular || 0) - Number(form.precio || 0), 0), [form.precio_regular, form.precio]);

  /* Handlers */
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'en_oferta') {
      const newVal = type === 'checkbox' ? checked : !!value;

      setForm((f) => {
        // Activar oferta: si no hay precio_regular válido, usar el precio actual como base
        if (newVal && !(Number(f.precio_regular) > 0)) {
          return { ...f, en_oferta: true, precio_regular: f.precio };
        }
        // Desactivar oferta: en edición, restaura el precio = precio_regular para mantener coherencia
        if (!newVal && isEdit && Number(f.precio_regular) > 0) {
          return { ...f, en_oferta: false, precio: f.precio_regular };
        }
        return { ...f, en_oferta: newVal };
      });
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFileChange = (e) => {
    setForm((f) => ({ ...f, imagenFile: e.target.files?.[0] || null }));
  };

  /* Submit */
  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.nombre?.trim()) return toast.warn('Falta nombre');
    if (form.precio === '' || form.precio === null) return toast.warn('Falta precio');
    if (!form.categoria_id) return toast.warn('Falta categoría');

    // Validación de oferta
    if (form.en_oferta) {
      const pr = Number(form.precio_regular);
      const po = Number(form.precio);
      if (!(pr > 0)) return toast.warn('Ingresa un precio regular válido para la oferta');
      if (!(po > 0)) return toast.warn('Ingresa un precio de oferta válido');
      if (po >= pr) return toast.warn('El precio de oferta debe ser menor al precio regular');
    }

    setSubmitting(true);
    try {
      if (!isEdit) {
        // Crear
        await createProducto({
          ...form,
          precio: Number(form.precio),
          precio_regular: form.en_oferta ? Number(form.precio_regular) : null, // si no está en oferta, enviamos null (backend lo ignora o deja existente)
          en_oferta: !!form.en_oferta,
          stock_actual: form.stock_actual === '' ? undefined : Number(form.stock_actual),
          stock_minimo: form.stock_minimo === '' ? 1 : Number(form.stock_minimo),
          categoria_id: Number(form.categoria_id),
        });

        toast.success('✅ Producto creado');
        onSaved?.();
      } else {
        // Actualizar (stock_actual bloqueado en edición)
        await updateProducto(productoEdit.id, {
          ...form,
          precio: form.precio === '' ? '' : Number(form.precio),
          precio_regular:
            form.en_oferta
              ? Number(form.precio_regular) // en oferta, guardamos precio_regular
              : (form.precio_regular === '' ? '' : Number(form.precio_regular)), // si desactivaste, lo dejamos tal cual para no perder historial
          en_oferta: !!form.en_oferta,
          stock_actual: '', // no se actualiza aquí
          stock_minimo: form.stock_minimo === '' ? '' : Number(form.stock_minimo),
          categoria_id: form.categoria_id === '' ? '' : Number(form.categoria_id),
        });

        toast.success('✅ Producto actualizado');
        onSaved?.();
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ Error al guardar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Precio {form.en_oferta && <span className="text-xs text-pink-600">(oferta)</span>}</label>
          <input
            type="number"
            step="0.01"
            name="precio"
            value={form.precio}
            onChange={onChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Stock actual</label>
          <input
            type="number"
            name="stock_actual"
            value={form.stock_actual}
            onChange={onChange}
            className="w-full border rounded px-2 py-1"
            readOnly={isEdit}
            disabled={isEdit}
          />
          {isEdit && (
            <small className="text-gray-500">
              El stock se modifica desde <strong>“Reponer”</strong>.
            </small>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Stock mínimo</label>
          <input
            type="number"
            name="stock_minimo"
            value={form.stock_minimo}
            onChange={onChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Categoría</label>
          <select
            name="categoria_id"
            value={form.categoria_id}
            onChange={onChange}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">-- Seleccione --</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={onChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Imagen principal */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Imagen principal</label>
        <input type="file" accept="image/*" onChange={onFileChange} />
        {form.imagenFile && (
          <img src={URL.createObjectURL(form.imagenFile)} className="h-28 object-contain mt-2 rounded border" />
        )}
        {!form.imagenFile && isEdit && productoEdit?.imagen_url && (
          <img src={publicUrl(productoEdit.imagen_url)} className="h-28 object-contain mt-2 rounded border" />
        )}
      </div>

      {/* Bloque OFERTA */}
      <div className="rounded-lg border p-3 bg-purple-50/40">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="en_oferta"
            checked={!!form.en_oferta}
            onChange={onChange}
          />
          <span className="font-semibold text-purple-800">En oferta</span>
        </label>

        {form.en_oferta && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium">Precio regular</label>
              <input
                type="number"
                step="0.01"
                name="precio_regular"
                value={form.precio_regular}
                onChange={onChange}
                className="w-full border rounded px-2 py-1"
              />
              <small className="text-gray-500">
                Si lo dejas igual, la oferta no aplicará (debe ser mayor que el precio de oferta).
              </small>
            </div>

            <div>
              <label className="block text-sm font-medium">Precio de oferta</label>
              <input
                type="number"
                step="0.01"
                name="precio"
                value={form.precio}
                onChange={onChange}
                className="w-full border rounded px-2 py-1"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[10, 15, 20, 25, 30].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        precio: Number((Number(f.precio_regular || f.precio) * (1 - p / 100)).toFixed(2)),
                        precio_regular: Number(f.precio_regular || f.precio),
                      }))
                    }
                    className="px-3 py-1 rounded-full border text-sm hover:bg-white"
                  >
                    -{p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 bg-white/60 rounded-md p-3 text-sm">
              <div className="flex justify-between">
                <span>Descuento</span>
                <span className="font-semibold">{descuentoPct}%</span>
              </div>
              <div className="flex justify-between">
                <span>Ahorro</span>
                <span className="font-semibold">{fmt(ahorro)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Galería existente (solo lectura en editar) */}
      {isEdit && (
        <div className="space-y-1">
          <label className="block text-sm font-medium">Galería actual (solo lectura)</label>
          {loadingGallery ? (
            <div className="text-sm text-gray-500">Cargando...</div>
          ) : !gallery.length ? (
            <div className="text-sm text-gray-500">Sin imágenes en galería</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {gallery.map((u, i) => (
                <div key={`${u}-${i}`} className="relative">
                  <img src={publicUrl(u)} className="h-20 w-full object-cover rounded border" />
                </div>
              ))}
            </div>
          )}
          <small className="text-gray-500">Para agregar o eliminar imágenes usa “Gestionar galería”.</small>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {submitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'} producto
        </button>
      </div>
    </form>
  );
}
