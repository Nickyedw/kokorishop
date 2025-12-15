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

// ──────────────────────────────────────────────
// ✅ NEW: Helpers para comprimir a WEBP (front)
// ──────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (alineado a tu backend)
const ALLOWED_MIME_IN = new Set(['image/jpeg', 'image/png', 'image/webp']); // lo que aceptas en input
const WEBP_QUALITY = 0.82; // 0.75–0.85 recomendado
const MAX_DIMENSION = 1600; // limita tamaño (reduce peso sin perder calidad)

const prettyMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

function sanitizeBaseName(name) {
  const base = (name || 'img').replace(/\.[^.]+$/, '');
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'img';
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function resizeToFit(w, h, maxDim) {
  if (!maxDim || maxDim <= 0) return { w, h };
  const maxSide = Math.max(w, h);
  if (maxSide <= maxDim) return { w, h };
  const scale = maxDim / maxSide;
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

async function compressToWebp(file, { quality = WEBP_QUALITY, maxDim = MAX_DIMENSION } = {}) {
  // Si ya es WEBP y pesa OK, igual podemos re-optimizar (opcional). Aquí lo re-optimizo para garantizar peso.
  const img = await loadImageFromFile(file);

  const { w, h } = resizeToFit(img.naturalWidth || img.width, img.naturalHeight || img.height, maxDim);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((resolve) => {
    // toBlob puede devolver null en navegadores raros
    canvas.toBlob((b) => resolve(b), 'image/webp', quality);
  });

  if (!blob) {
    // fallback: si no soporta webp, devolvemos el archivo original
    return { file, blob: null, didWebp: false };
  }

  const base = sanitizeBaseName(file.name);
  const webpFile = new File([blob], `${base}.webp`, { type: 'image/webp' });

  return { file: webpFile, blob, didWebp: true };
}

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
    imagenFile: null, // principal (aquí guardaremos el WEBP ya comprimido)
  });

  const [submitting, setSubmitting] = useState(false);

  // Galería (solo lectura)
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // ✅ NEW: preview controlado (sin fugas)
  const [previewUrl, setPreviewUrl] = useState('');
  const [compressing, setCompressing] = useState(false);

  /* 1) Sincroniza el formulario cuando cambia productoEdit */
  useEffect(() => {
    setForm({
      nombre: productoEdit?.nombre ?? '',
      descripcion: productoEdit?.descripcion ?? '',
      precio: productoEdit?.precio ?? '',
      en_oferta: !!productoEdit?.en_oferta,
      precio_regular:
        productoEdit?.precio_regular ?? (productoEdit?.en_oferta ? productoEdit?.precio_regular : ''),
      stock_actual: productoEdit?.stock_actual ?? '',
      stock_minimo: productoEdit?.stock_minimo ?? 1,
      categoria_id: productoEdit?.categoria_id ?? '',
      imagenFile: null,
    });

    setGallery([]);

    // limpia preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  }, [productoEdit]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // revocar preview al desmontar o cambiar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  // ✅ UPDATED: valida + comprime a WEBP antes de guardar en estado
  const onFileChange = async (e) => {
    const raw = e.target.files?.[0] || null;

    // limpia preview anterior
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    if (!raw) {
      setForm((f) => ({ ...f, imagenFile: null }));
      return;
    }

    // Validación tipo entrada
    if (!ALLOWED_MIME_IN.has(raw.type)) {
      toast.error('Formato no permitido. Usa JPG, PNG o WEBP.');
      e.target.value = '';
      setForm((f) => ({ ...f, imagenFile: null }));
      return;
    }

    // Si el original ya supera 5MB, igual intentamos comprimir (puede bajar mucho).
    // Pero si es exageradamente grande, avisamos.
    if (raw.size > 25 * 1024 * 1024) {
      toast.warn(`La imagen es muy pesada (${prettyMB(raw.size)}). Se intentará comprimir a WEBP, pero puede demorar.`);
    }

    setCompressing(true);
    try {
      const { file: webpFile, didWebp } = await compressToWebp(raw, {
        quality: WEBP_QUALITY,
        maxDim: MAX_DIMENSION,
      });

      // Validación final: que no pase 5MB (límite backend)
      if (webpFile.size > MAX_FILE_SIZE) {
        toast.error(
          `Aun comprimida pesa ${prettyMB(webpFile.size)}. ` +
          `Intenta usar una imagen más pequeña o recortada.`
        );
        e.target.value = '';
        setForm((f) => ({ ...f, imagenFile: null }));
        return;
      }

      // Preview del archivo final (WEBP)
      const url = URL.createObjectURL(webpFile);
      setPreviewUrl(url);
      setForm((f) => ({ ...f, imagenFile: webpFile }));

      // Mensaje UX opcional
      const msg = didWebp
        ? `✅ Convertida a WEBP (${prettyMB(webpFile.size)})`
        : `✅ Imagen lista (${prettyMB(webpFile.size)})`;
      toast.success(msg);
    } catch (err) {
      console.error(err);
      toast.error('❌ No se pudo procesar la imagen. Intenta con otra.');
      e.target.value = '';
      setForm((f) => ({ ...f, imagenFile: null }));
    } finally {
      setCompressing(false);
    }
  };

  /* Submit */
  const submit = async (e) => {
    e.preventDefault();
    if (submitting || compressing) return;

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

    // Validación final imagen (por si acaso)
    if (form.imagenFile && form.imagenFile.size > MAX_FILE_SIZE) {
      return toast.error(`La imagen supera 5MB (${prettyMB(form.imagenFile.size)}).`);
    }

    setSubmitting(true);
    try {
      if (!isEdit) {
        // Crear
        await createProducto({
          ...form,
          precio: Number(form.precio),
          precio_regular: form.en_oferta ? Number(form.precio_regular) : null,
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
              ? Number(form.precio_regular)
              : (form.precio_regular === '' ? '' : Number(form.precio_regular)),
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
          <label className="block text-sm font-medium">
            Precio {form.en_oferta && <span className="text-xs text-pink-600">(oferta)</span>}
          </label>
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
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} />

        <small className="text-gray-500">
          Se convertirá a <strong>WEBP</strong> automáticamente (máx. 5MB).
          {compressing ? <span className="ml-2 text-purple-700 font-semibold">Procesando…</span> : null}
        </small>

        {/* Preview del archivo final (WEBP) */}
        {previewUrl && (
          <img
            src={previewUrl}
            className="h-28 object-contain mt-2 rounded border"
            alt="Preview"
          />
        )}

        {/* Si no hay preview y está editando, muestra la actual */}
        {!previewUrl && !form.imagenFile && isEdit && productoEdit?.imagen_url && (
          <img
            src={publicUrl(productoEdit.imagen_url)}
            className="h-28 object-contain mt-2 rounded border"
            alt={productoEdit?.nombre || 'Imagen actual'}
          />
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
          disabled={submitting || compressing}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {submitting ? 'Guardando...' : compressing ? 'Procesando imagen...' : isEdit ? 'Actualizar' : 'Crear'} producto
        </button>
      </div>
    </form>
  );
}
