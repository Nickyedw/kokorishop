// backend/services/productService.js
const path = require('path');
const fs = require('fs');
const pool = require('../db');

/* =========================
   Helpers de rutas/archivos
   ========================= */
function normalizePublicUrl(input) {
  if (!input) return null;
  if (/^https?:\/\//i.test(input)) return input;            // http/https
  let s = String(input).replace(/\\/g, '/');                 // backslashes -> slashes
  const idx = s.toLowerCase().indexOf('/uploads/');
  if (idx !== -1) return s.slice(idx);                       // ".../uploads/..."
  if (/^uploads\//i.test(s)) return '/' + s;                 // "uploads/..."
  if (/^\/uploads\//i.test(s)) return s;                     // "/uploads/..."
  return '/uploads/' + s.replace(/^\/+/, '');                // nombre de archivo
}

function isLocalUpload(url) {
  return typeof url === 'string' && (url.startsWith('/uploads/') || url.startsWith('uploads/'));
}
function absoluteUploadPath(url) {
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return path.join(__dirname, '..', clean);
}

/* =========================
   Productos: CRUD + queries con galería
   ========================= */

// Obtener todos los productos con su galería (array imagenes)
const obtenerProductos = async () => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        c.nombre AS categoria_nombre,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'url', pi.url_imagen,
              'es_principal', pi.es_principal,
              'orden', pi.orden
            )
            ORDER BY pi.es_principal DESC, pi.orden ASC, pi.id ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS imagenes
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
      GROUP BY p.id, c.nombre
      ORDER BY p.id DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Crear nuevo producto (incluye oferta/flags; normaliza imagen_url)
const crearProducto = async ({
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
}) => {
  const safeUrl = imagen_url ? normalizePublicUrl(imagen_url) : null;

  const query = `
    INSERT INTO productos
      (nombre, descripcion, precio, precio_regular, en_oferta,
       stock_actual, stock_minimo, categoria_id, imagen_url, destacado, mas_vendido)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`;
  const values = [
    nombre,
    descripcion,
    precio,
    precio_regular,
    !!en_oferta,
    stock_actual,
    stock_minimo,
    categoria_id,
    safeUrl,
    !!destacado,
    !!mas_vendido,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Actualizar producto (incluye precio_regular, en_oferta, mas_vendido; normaliza imagen si llega)
const actualizarProducto = async (id, campos) => {
  const columnas = [];
  const valores = [];
  let index = 1;

  // Si llega nueva imagen principal, elimina la anterior (si es local)
  if (campos.imagen_url) {
    const prev = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
    const producto = prev.rows[0];
    if (producto && producto.imagen_url) {
      const rutaImagen = path.join(__dirname, '..', producto.imagen_url.replace(/^\//, ''));
      if (fs.existsSync(rutaImagen)) {
        try { fs.unlinkSync(rutaImagen); } catch {/* noop */}
      }
    }
  }

  const add = (campo, valor) => {
    columnas.push(`${campo} = $${index++}`);
    valores.push(valor);
  };

  if (Object.prototype.hasOwnProperty.call(campos, 'nombre')) add('nombre', campos.nombre);
  if (Object.prototype.hasOwnProperty.call(campos, 'descripcion')) add('descripcion', campos.descripcion);
  if (Object.prototype.hasOwnProperty.call(campos, 'precio')) add('precio', campos.precio);
  if (Object.prototype.hasOwnProperty.call(campos, 'precio_regular')) add('precio_regular', campos.precio_regular);
  if (Object.prototype.hasOwnProperty.call(campos, 'en_oferta')) add('en_oferta', campos.en_oferta);
  if (Object.prototype.hasOwnProperty.call(campos, 'destacado')) add('destacado', campos.destacado);
  if (Object.prototype.hasOwnProperty.call(campos, 'mas_vendido')) add('mas_vendido', campos.mas_vendido);
  if (Object.prototype.hasOwnProperty.call(campos, 'stock_actual')) add('stock_actual', campos.stock_actual);
  if (Object.prototype.hasOwnProperty.call(campos, 'stock_minimo')) add('stock_minimo', campos.stock_minimo);
  if (Object.prototype.hasOwnProperty.call(campos, 'categoria_id')) add('categoria_id', campos.categoria_id);
  if (Object.prototype.hasOwnProperty.call(campos, 'imagen_url')) {
    add('imagen_url', normalizePublicUrl(campos.imagen_url));
  }

  if (columnas.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  const query = `
    UPDATE productos
    SET ${columnas.join(', ')}
    WHERE id = $${index}
    RETURNING *`;
  valores.push(id);

  const result = await pool.query(query, valores);
  return result.rows[0];
};

// Eliminar producto (principal + todas las imágenes asociadas si son locales)
const eliminarProducto = async (id) => {
  // 1) principal
  const resProd = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
  const prod = resProd.rows[0];

  // 2) galería
  const resImgs = await pool.query('SELECT url_imagen FROM producto_imagenes WHERE producto_id = $1', [id]);
  const imagenes = resImgs.rows || [];

  // 3) borrar archivos locales
  if (prod && prod.imagen_url && isLocalUpload(prod.imagen_url)) {
    const abs = absoluteUploadPath(prod.imagen_url);
    if (fs.existsSync(abs)) { try { fs.unlinkSync(abs); } catch {/* noop */} }
  }
  for (const row of imagenes) {
    const url = row.url_imagen;
    if (url && isLocalUpload(url)) {
      const abs = absoluteUploadPath(url);
      if (fs.existsSync(abs)) { try { fs.unlinkSync(abs); } catch {/* noop */} }
    }
  }

  // 4) borrar de DB (producto_imagenes cae por ON DELETE CASCADE)
  await pool.query('DELETE FROM productos WHERE id = $1', [id]);
};

// Buscar productos por nombre o descripción
const buscarProductos = async (texto) => {
  const result = await pool.query(
    `SELECT * FROM productos
     WHERE LOWER(nombre) LIKE LOWER($1)
        OR LOWER(descripcion) LIKE LOWER($1)
     ORDER BY id DESC`,
    [`%${texto}%`]
  );
  return result.rows;
};

// Filtrar por categoría con galería
const obtenerProductosPorCategoria = async (categoriaId) => {
  const result = await pool.query(`
    SELECT
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url_imagen,
            'es_principal', pi.es_principal,
            'orden', pi.orden
          )
          ORDER BY pi.es_principal DESC, pi.orden ASC, pi.id ASC
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS imagenes
    FROM productos p
    LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
    WHERE p.categoria_id = $1
    GROUP BY p.id
    ORDER BY p.id DESC
  `, [categoriaId]);
  return result.rows;
};

// Obtener un producto por ID con galería
const obtenerProductoPorId = async (id) => {
  const result = await pool.query(`
    SELECT
      p.*,
      c.nombre AS categoria_nombre,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url_imagen,
            'es_principal', pi.es_principal,
            'orden', pi.orden
          )
          ORDER BY pi.es_principal DESC, pi.orden ASC, pi.id ASC
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS imagenes
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
    WHERE p.id = $1
    GROUP BY p.id, c.nombre
    LIMIT 1
  `, [id]);
  return result.rows[0];
};

// Disminuir stock (al realizar pedido)
const disminuirStock = async (productoId, cantidad) => {
  const result = await pool.query(
    `UPDATE productos
     SET stock_actual = stock_actual - $1
     WHERE id = $2 AND stock_actual >= $1
     RETURNING *`,
    [cantidad, productoId]
  );
  if (result.rows.length === 0) {
    throw new Error('Stock insuficiente para el producto ID ' + productoId);
  }
};

// Aumentar stock manualmente
const aumentarStock = async (productoId, cantidad) => {
  const result = await pool.query(
    `UPDATE productos
     SET stock_actual = stock_actual + $1
     WHERE id = $2
     RETURNING *`,
    [cantidad, productoId]
  );
  return result.rows[0];
};

// Productos con stock bajo
const obtenerProductosConStockBajo = async () => {
  const result = await pool.query(`
    SELECT * FROM productos
    WHERE stock_actual <= stock_minimo
    ORDER BY stock_actual ASC
  `);
  return result.rows;
};

// Actualizar stock directamente
const actualizarStock = async (producto_id, nuevoStock) => {
  const result = await pool.query(
    'UPDATE productos SET stock_actual = $1 WHERE id = $2 RETURNING *',
    [nuevoStock, producto_id]
  );
  return result.rows[0];
};

// Registrar reposición de stock
const registrarReposicionStock = async ({ producto_id, cantidad, usuario_id }) => {
  const cantidadNumerica = parseInt(cantidad);
  if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
    throw new Error('Cantidad inválida para reposición');
  }

  const producto = await pool.query('SELECT stock_actual FROM productos WHERE id = $1', [producto_id]);
  const stockAnterior = producto.rows[0].stock_actual;
  const stockNuevo = stockAnterior + cantidadNumerica;

  await actualizarStock(producto_id, stockNuevo);

  await pool.query(
    `INSERT INTO historial_reposiciones 
     (producto_id, cantidad_agregada, stock_anterior, stock_nuevo, usuario_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [producto_id, cantidadNumerica, stockAnterior, stockNuevo, usuario_id]
  );
};

// Historial de reposiciones
const obtenerHistorialReposiciones = async () => {
  const result = await pool.query(`
    SELECT 
      h.*, 
      p.nombre AS producto_nombre,
      u.nombre_completo AS usuario_nombre
    FROM historial_reposiciones h
    JOIN productos p ON h.producto_id = p.id
    JOIN usuarios u ON h.usuario_id = u.id
    ORDER BY h.fecha DESC
  `);
  return result.rows;
};

/* =========================
   Listas especiales
   ========================= */

const obtenerProductosDestacados = async () => {
  const result = await pool.query(`
    SELECT
      p.*,
      c.nombre AS categoria_nombre,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url_imagen,
            'es_principal', pi.es_principal,
            'orden', pi.orden
          )
          ORDER BY pi.es_principal DESC, pi.orden ASC, pi.id ASC
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS imagenes
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
    WHERE p.destacado = TRUE AND p.stock_actual > 0
    GROUP BY p.id, c.nombre
    ORDER BY p.creado_en DESC
    LIMIT 12
  `);
  return result.rows;
};

const obtenerProductosMasVendidos = async () => {
  const result = await pool.query(`
    SELECT 
      p.*,
      c.nombre AS categoria_nombre,
      SUM(dp.cantidad) AS total_vendido,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url_imagen,
            'es_principal', pi.es_principal,
            'orden', pi.orden
          )
          ORDER BY pi.es_principal DESC, pi.orden ASC, pi.id ASC
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS imagenes
    FROM productos p
    JOIN detalle_pedido dp ON dp.producto_id = p.id
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
    GROUP BY p.id, c.nombre
    HAVING SUM(dp.cantidad) > 0
    ORDER BY total_vendido DESC
    LIMIT 12
  `);
  return result.rows;
};

const obtenerProductosEnOferta = async () => {
  const result = await pool.query(`
    SELECT
      p.*,
      c.nombre AS categoria_nombre,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url_imagen,
            'es_principal', pi.es_principal,
            'orden', pi.orden
          )
          ORDER BY pi.es_principal DESC, pi.orden ASC, pi.id ASC
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS imagenes
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
    WHERE p.en_oferta = TRUE
      AND p.stock_actual > 0
      AND p.precio_regular > p.precio          -- oferta real
    GROUP BY p.id, c.nombre
    ORDER BY p.creado_en DESC
    LIMIT 12
  `);
  return result.rows;
};

/* =========================
   📸 Galería (tabla producto_imagenes)
   ========================= */

// Obtener array de imágenes (ordenadas)
const obtenerImagenesProducto = async (productoId) => {
  const res = await pool.query(
    `SELECT id, url_imagen AS url, es_principal, orden
     FROM producto_imagenes
     WHERE producto_id = $1
     ORDER BY es_principal DESC, orden ASC, id ASC`,
    [productoId]
  );
  // normaliza url por si quedara sucia
  return res.rows.map(r => ({ ...r, url: normalizePublicUrl(r.url) }));
};

// Agregar una o varias imágenes (urls) a la galería, sin duplicar y devolviendo la galería completa
const agregarImagenesProducto = async (productoId, urls = [], options = {}) => {
  const toPublicPath = (u) => {
    if (!u || typeof u !== 'string') return '';
    const s = u.trim().replace(/\\/g, '/');
    if (!s) return '';
    const i = s.toLowerCase().indexOf('/uploads/');
    if (i >= 0) return s.slice(i);
    if (s.startsWith('/uploads/')) return s;
    if (s.startsWith('/')) return s;
    return `/uploads/${s}`;
  };

  const limpias = urls.map(toPublicPath).filter(Boolean);
  const unicas = Array.from(new Set(limpias));

  for (const url of unicas) {
    try {
      await pool.query(
        `INSERT INTO producto_imagenes (producto_id, url_imagen, es_principal, orden)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (producto_id, url_imagen) DO NOTHING`,
        [productoId, url, options.es_principal === true, options.orden ?? 0]
      );
    } catch (err) {
      if (err && err.code === '23505') continue; // duplicado
      throw err;
    }
  }

  const res = await pool.query(
    `SELECT id, url_imagen AS url, es_principal, orden
       FROM producto_imagenes
      WHERE producto_id = $1
      ORDER BY es_principal DESC, orden ASC, id ASC`,
    [productoId]
  );

  const seen = new Set();
  const out = [];
  for (const r of res.rows) {
    if (r.url && !seen.has(r.url)) {
      seen.add(r.url);
      out.push(r);
    }
  }
  return out;
};

// Eliminar imagen por ID
const eliminarImagenProducto = async (productoId, imagenId) => {
  const img = await pool.query(
    `SELECT id, url_imagen, es_principal
       FROM producto_imagenes
      WHERE id = $1 AND producto_id = $2`,
    [imagenId, productoId]
  );
  const row = img.rows[0];
  if (!row) return;

  if (row.es_principal === true) {
    const err = new Error('NO_DELETE_PRINCIPAL');
    err.code = 'NO_DELETE_PRINCIPAL';
    throw err;
  }

  const url = row.url_imagen;
  if (url && isLocalUpload(url)) {
    const abs = absoluteUploadPath(url);
    if (fs.existsSync(abs)) { try { fs.unlinkSync(abs); } catch {/* noop */} }
  }

  await pool.query(
    `DELETE FROM producto_imagenes WHERE id = $1 AND producto_id = $2`,
    [imagenId, productoId]
  );

  const after = await pool.query(
    `SELECT id, url_imagen AS url, es_principal, orden
       FROM producto_imagenes
      WHERE producto_id = $1
      ORDER BY es_principal DESC, orden ASC, id ASC`,
    [productoId]
  );
  return after.rows;
};

module.exports = {
  // CRUD base
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  obtenerProductosPorCategoria,
  obtenerProductoPorId,

  // Stock
  disminuirStock,
  aumentarStock,
  obtenerProductosConStockBajo,
  actualizarStock,
  registrarReposicionStock,
  obtenerHistorialReposiciones,

  // Listas especiales
  obtenerProductosDestacados,
  obtenerProductosMasVendidos,
  obtenerProductosEnOferta,

  // 📸 Galería (tabla)
  obtenerImagenesProducto,
  agregarImagenesProducto,
  eliminarImagenProducto,

  // Helper
  normalizePublicUrl,
};
