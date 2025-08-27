// backend/routes/productos.js
const express = require('express');
const path = require('path');
const router = express.Router();

const subirImagen = require('../middlewares/uploadMiddleware'); // .single / .array
const { verificarToken } = require('../middlewares/auth');

const {
  // CRUD / listas
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  productosPorCategoria,
  obtenerProductoPorId,
  reponerStock,
  historialReposiciones,
  productosMasVendidos,
  productosDestacados,
  productosEnOferta,

  // 📸 Galería
  obtenerImagenesProducto,
  agregarImagenesProducto,
  eliminarImagenProducto,
} = require('../controllers/productController');

/* ===================================================================
   Utilidades locales
   =================================================================== */
const ensureJson = (req, res, next) => express.json()(req, res, next);

// Cabeceras para evitar caché del navegador/proxy
const noStore = (_req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
  next();
};

/** Convierte ruta física a URL pública iniciando en “/uploads/...” */
const filePathToPublicUrl = (absPath) => {
  if (!absPath) return '';
  const rel = path
    .relative(path.join(__dirname, '..'), absPath)
    .replace(/\\/g, '/'); // Windows friendly
  return `/${rel}`; // => "/uploads/..." si tu storage sube a backend/uploads/...
};

/* ===================================================================
   Búsquedas / listados
   =================================================================== */
router.get('/buscar', buscarProductos);
router.get('/categoria/:id', productosPorCategoria);
router.get('/historial-reposiciones', verificarToken, historialReposiciones);
router.get('/destacados', productosDestacados);
router.get('/mas-vendidos', productosMasVendidos);

// Ofertas: mantenemos /oferta y añadimos /ofertas (plural)
router.get('/oferta', productosEnOferta);
router.get('/ofertas', productosEnOferta);

router.get('/', listarProductos);
router.get('/:id', obtenerProductoPorId);

/* ===================================================================
   Crear / actualizar producto (imagen principal opcional)
   =================================================================== */

// Crear producto: ahora acepta multipart O JSON puro (igual que PUT)
router.post(
  '/',
  (req, res, next) => {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('multipart/form-data')) {
      return subirImagen.single('imagen')(req, res, next);
    }
    if (ct.includes('application/json')) {
      return ensureJson(req, res, next);
    }
    next();
  },
  crearProducto
);

// Actualizar producto (con o sin imagen principal)
router.put(
  '/:id',
  (req, res, next) => {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('multipart/form-data')) {
      // viene con nueva imagen principal
      return subirImagen.single('imagen')(req, res, next);
    }
    if (ct.includes('application/json')) {
      return ensureJson(req, res, next);
    }
    next();
  },
  actualizarProducto
);

/* ===================================================================
   Flags y helpers: oferta / destacado
   =================================================================== */

// Toggle simple de en_oferta (sólo bandera)
router.put('/:id/en_oferta', ensureJson, async (req, res) => {
  try {
    const { id } = req.params;
    const { en_oferta } = req.body ?? {};
    if (typeof en_oferta === 'undefined') {
      return res.status(400).json({ error: 'Campo "en_oferta" es requerido' });
    }
    const productService = require('../services/productService');
    const actualizado = await productService.actualizarProducto(id, {
      en_oferta: en_oferta === true || en_oferta === 'true',
    });
    res.json(actualizado);
  } catch (error) {
    console.error('❌ Error en PUT /en_oferta:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint “todo en uno” para oferta (flag + precio_regular [+ precio opcional])
router.put('/:id/oferta', ensureJson, async (req, res) => {
  try {
    const { id } = req.params;
    let { en_oferta, precio_regular, precio } = req.body ?? {};

    const toBool = (v) => v === true || v === 'true';
    en_oferta = toBool(en_oferta);

    if (en_oferta && (precio_regular == null)) {
      return res.status(400).json({ error: 'Si en_oferta=true, "precio_regular" es requerido' });
    }

    if (precio_regular != null && isNaN(Number(precio_regular))) {
      return res.status(400).json({ error: '"precio_regular" debe ser numérico' });
    }
    if (precio != null && isNaN(Number(precio))) {
      return res.status(400).json({ error: '"precio" debe ser numérico' });
    }

    // Validación básica cuando se activa oferta
    if (en_oferta && precio != null && Number(precio_regular) <= Number(precio)) {
      return res.status(400).json({ error: '"precio_regular" debe ser mayor que "precio"' });
    }

    const productService = require('../services/productService');
    const payload = {
      en_oferta,
      // si NO está en oferta, dejamos precio_regular = precio (consistencia)
      precio_regular: en_oferta
        ? Number(precio_regular)
        : (precio != null ? Number(precio) : undefined),
    };
    if (precio != null) payload.precio = Number(precio);

    const actualizado = await productService.actualizarProducto(id, payload);
    res.json(actualizado);
  } catch (error) {
    console.error('❌ Error en PUT /:id/oferta:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/destacado', ensureJson, async (req, res) => {
  try {
    const { id } = req.params;
    const { destacado } = req.body ?? {};
    if (typeof destacado === 'undefined') {
      return res.status(400).json({ error: 'Campo "destacado" es requerido' });
    }
    const productService = require('../services/productService');
    const actualizado = await productService.actualizarProducto(id, {
      destacado: destacado === true || destacado === 'true',
    });
    res.json(actualizado);
  } catch (error) {
    console.error('❌ Error en PUT /destacado:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ===================================================================
   Galería de imágenes
   - GET:   devuelve array de objetos {id,url,...} (URLs normalizadas)
   - POST:  acepta multipart (field "imagenes") o JSON { urls:[] | csv }
   - DELETE: elimina por ID de imagen
   =================================================================== */

// GET galería (sin caché)
router.get('/:id/imagenes', noStore, obtenerImagenesProducto);

// POST galería (multipart o JSON) + no-cache
router.post(
  '/:id/imagenes',
  (req, res, next) => {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('multipart/form-data')) {
      // hasta 6 archivos por subida (ajusta si quieres)
      return subirImagen.array('imagenes', 6)(req, res, next);
    }
    if (ct.includes('application/json')) {
      return ensureJson(req, res, next);
    }
    // Content-Type desconocido: seguimos sin crash y sin body parser
    next();
  },
  (req, res, next) => {
    try {
      // 1) Del multipart (si hay)
      const files = Array.isArray(req.files) ? req.files : [];
      const urlsFromFiles = files
        .map((f) => filePathToPublicUrl(f?.path))
        .filter(Boolean);

      // 2) Del body (compat): puede llegar array o string CSV
      const body = req.body || {};
      let urlsBody = [];
      if (Array.isArray(body.urls)) {
        urlsBody = body.urls
          .map((u) => (typeof u === 'string' ? u.trim() : ''))
          .filter(Boolean);
      } else if (typeof body.urls === 'string') {
        urlsBody = body.urls
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // 3) Merge + dedupe
      const merged = [...urlsBody, ...urlsFromFiles];
      const unique = Array.from(new Set(merged));

      // 4) Normalizamos para el controller
      req.body = { ...body, urls: unique };

      return next();
    } catch (err) {
      return next(err);
    }
  },
  noStore,
  agregarImagenesProducto
);

// DELETE imagen por ID (sin caché)
router.delete('/:id/imagenes/:imgId', noStore, eliminarImagenProducto);

/* ===================================================================
   Eliminar / reponer stock
   =================================================================== */
router.delete('/:id', eliminarProducto);
router.post('/:id/reponer', verificarToken, reponerStock);

module.exports = router;
