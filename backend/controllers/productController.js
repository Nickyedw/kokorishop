// backend/controllers/productController.js
const productService = require('../services/productService');
const pool = require('../db');

/* =========================
   Util: cabeceras no-cache
   ========================= */
const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

/* =========================
   Productos (CRUD + listas)
   ========================= */

// Listar todos los productos
const listarProductos = async (_req, res) => {
  try {
    const productos = await productService.obtenerProductos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener producto por ID
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await productService.obtenerProductoPorId(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear nuevo producto (imagen principal opcional)
const crearProducto = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No se recibieron datos del formulario' });
    }

    let {
      nombre,
      descripcion,
      precio,
      stock_actual,
      stock_minimo,
      categoria_id,
      destacado,
      mas_vendido,
      en_oferta,
      precio_regular,
    } = req.body;

    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    if (!nombre || !descripcion || precio == null || stock_actual == null || stock_minimo == null || !categoria_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Normalizaciones numéricas/booleanas
    precio = parseFloat(precio);
    precio_regular = precio_regular != null ? parseFloat(precio_regular) : undefined;
    stock_actual = parseInt(stock_actual);
    stock_minimo = parseInt(stock_minimo);
    categoria_id = parseInt(categoria_id);
    destacado = destacado === true || destacado === 'true';
    mas_vendido = mas_vendido === true || mas_vendido === 'true';
    en_oferta = en_oferta === true || en_oferta === 'true';

    // Reglas de oferta
    if (en_oferta) {
      if (precio_regular == null) {
        return res.status(400).json({ error: 'Si en_oferta=true, "precio_regular" es requerido' });
      }
      if (!(precio_regular > precio)) {
        return res.status(400).json({ error: '"precio_regular" debe ser mayor que "precio"' });
      }
    } else {
      // Consistencia: si no está en oferta, el regular = precio actual
      precio_regular = precio_regular != null ? parseFloat(precio_regular) : precio;
    }

    const nuevoProducto = await productService.crearProducto({
      nombre,
      descripcion,
      precio,
      precio_regular,
      en_oferta,
      stock_actual,
      stock_minimo,
      categoria_id,
      imagen_url,
      destacado,
      mas_vendido,
    });

    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar producto principal (incluye reglas de oferta)
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const body = JSON.parse(JSON.stringify(req.body || {}));
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    const campos = {};
    if (body.nombre?.trim()) campos.nombre = body.nombre;
    if (body.descripcion?.trim()) campos.descripcion = body.descripcion;
    if (body.precio !== undefined && body.precio !== '') campos.precio = parseFloat(body.precio);
    if (body.precio_regular !== undefined && body.precio_regular !== '') campos.precio_regular = parseFloat(body.precio_regular);
    if (body.stock_actual !== undefined && body.stock_actual !== '') campos.stock_actual = parseInt(body.stock_actual);
    if (body.stock_minimo !== undefined && body.stock_minimo !== '') campos.stock_minimo = parseInt(body.stock_minimo);
    if (body.categoria_id !== undefined && body.categoria_id !== '') campos.categoria_id = parseInt(body.categoria_id);
    if (imagen_url) campos.imagen_url = imagen_url;

    // booleanos
    if ('destacado' in body) {
      campos.destacado = body.destacado === true || body.destacado === 'true';
    }
    if ('en_oferta' in body) {
      campos.en_oferta = body.en_oferta === true || body.en_oferta === 'true';
    }
    if ('mas_vendido' in body) {
      campos.mas_vendido = body.mas_vendido === true || body.mas_vendido === 'true';
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    // Reglas de consistencia para oferta:
    // necesitamos conocer el precio y el precio_regular finales.
    const actual = await productService.obtenerProductoPorId(id);
    if (!actual) return res.status(404).json({ error: 'Producto no encontrado' });

    const final_en_oferta = ('en_oferta' in campos) ? campos.en_oferta : !!actual.en_oferta;
    const final_precio = ('precio' in campos) ? Number(campos.precio) : Number(actual.precio);
    const final_precio_regular = ('precio_regular' in campos)
      ? Number(campos.precio_regular)
      : (final_en_oferta ? Number(actual.precio_regular) : final_precio);

    if (final_en_oferta) {
      if (!(final_precio_regular > final_precio)) {
        return res.status(400).json({ error: '"precio_regular" debe ser mayor que "precio" cuando en_oferta=true' });
      }
    } else {
      // Si se desactiva oferta, dejamos precio_regular = precio para consistencia
      campos.precio_regular = final_precio;
    }

    const productoActualizado = await productService.actualizarProducto(id, campos);
    res.json(productoActualizado);
  } catch (err) {
    console.error('❌ Error al actualizar producto:', err);
    res.status(500).json({ error: err.message });
  }
};

// Flags individuales
const actualizarCampoDestacado = async (req, res) => {
  try {
    const { id } = req.params;
    const { destacado } = req.body;
    if (typeof destacado === 'undefined') {
      return res.status(400).json({ error: 'No se proporcionó el campo destacado' });
    }
    const actualizado = await productService.actualizarProducto(id, {
      destacado: destacado === true || destacado === 'true',
    });
    res.json(actualizado);
  } catch (err) {
    console.error('❌ Error al actualizar destacado:', err);
    res.status(500).json({ error: err.message });
  }
};

const actualizarCampoOferta = async (req, res) => {
  try {
    const { id } = req.params;
    const { en_oferta } = req.body;
    if (typeof en_oferta === 'undefined') {
      return res.status(400).json({ error: 'No se proporcionó el campo en_oferta' });
    }
    const actualizado = await productService.actualizarProducto(id, {
      en_oferta: en_oferta === true || en_oferta === 'true',
    });
    res.json(actualizado);
  } catch (err) {
    console.error('❌ Error al actualizar en_oferta:', err);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await productService.obtenerProductoPorId(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    await productService.eliminarProducto(id);
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto, puede tener dependencias asociadas' });
  }
};

// Buscar / categoría
const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    const productos = await productService.buscarProductos(q);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const productosPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const productos = await productService.obtenerProductosPorCategoria(id);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reposición de stock
const reponerStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    const cantidadNumerica = parseInt(cantidad);
    const usuario_id = req.usuario?.usuario_id || null;

    if (!cantidad || isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    const producto = await productService.obtenerProductoPorId(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const stockAnterior = producto.stock_actual;
    const stockNuevo = stockAnterior + cantidadNumerica;

    await productService.actualizarStock(producto.id, stockNuevo);

    await pool.query(
      `INSERT INTO historial_reposiciones 
       (producto_id, cantidad_agregada, stock_anterior, stock_nuevo, usuario_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [producto.id, cantidadNumerica, stockAnterior, stockNuevo, usuario_id]
    );

    res.json({ mensaje: 'Stock repuesto correctamente' });
  } catch (error) {
    console.error('Error al reponer stock:', error);
    res.status(500).json({ error: 'Error al reponer stock' });
  }
};

const historialReposiciones = async (_req, res) => {
  try {
    const historial = await productService.obtenerHistorialReposiciones();
    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial de reposiciones' });
  }
};

const productosDestacados = async (_req, res) => {
  try {
    const productos = await productService.obtenerProductosDestacados();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos destacados:', error);
    res.status(500).json({ error: 'Error al obtener productos destacados' });
  }
};

const productosMasVendidos = async (_req, res) => {
  try {
    const productos = await productService.obtenerProductosMasVendidos();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({ error: 'Error al obtener productos más vendidos' });
  }
};

const productosEnOferta = async (_req, res) => {
  try {
    const productos = await productService.obtenerProductosEnOferta();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos en oferta:', error);
    res.status(500).json({ error: 'Error al obtener productos en oferta' });
  }
};

/* =========================
   📸 Galería (usa productService)
   ========================= */

// GET /:id/imagenes
const obtenerImagenesProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const imgs = await productService.obtenerImagenesProducto(id);
    res.set(noStoreHeaders); // evita 304/caché
    res.json(Array.isArray(imgs) ? imgs : []);
  } catch (err) {
    console.error('❌ Error al obtener galería:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /:id/imagenes
const agregarImagenesProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // urls puede venir del body o de req.files
    const bodyUrls = Array.isArray(req.body.urls)
      ? req.body.urls
      : typeof req.body.urls === 'string'
        ? req.body.urls.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const files = Array.isArray(req.files) ? req.files : [];
    const result = await productService.agregarImagenesProducto(id, bodyUrls, {}, files);

    res.set(noStoreHeaders);
    res.json(result);
  } catch (err) {
    console.error('❌ Error al agregar imágenes:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /:id/imagenes/:imgId
const eliminarImagenProducto = async (req, res) => {
  try {
    const { id, imgId } = req.params;
    const next = await productService.eliminarImagenProducto(id, imgId);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, eliminado: imgId, result: next });
  } catch (err) {
    if (err.code === 'NO_DELETE_PRINCIPAL') {
      return res.status(409).json({ error: 'No se puede eliminar la imagen principal desde la galería' });
    }
    console.error('❌ Error al eliminar imagen de la galería:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  productosPorCategoria,
  obtenerProductoPorId,
  reponerStock,
  historialReposiciones,
  productosDestacados,
  productosMasVendidos,
  productosEnOferta,
  actualizarCampoDestacado,
  actualizarCampoOferta,

  // galería
  obtenerImagenesProducto,
  agregarImagenesProducto,
  eliminarImagenProducto,
};
