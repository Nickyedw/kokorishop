// backend/services/productService.js
const path = require('path');
const fs = require('fs');
const pool = require('../db');

// Obtener todos los productos ordenados por ID descendente
const obtenerProductos = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*, 
        c.nombre AS categoria_nombre 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Crear nuevo producto
const crearProducto = async ({ nombre, descripcion, precio, stock_actual, stock_minimo, categoria_id, imagen_url }) => {
  const query = `
    INSERT INTO productos (nombre, descripcion, precio, stock_actual, stock_minimo, categoria_id, imagen_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;
  const values = [nombre, descripcion, precio, stock_actual, stock_minimo, categoria_id, imagen_url];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Actualizar producto existente
const actualizarProducto = async (id, campos) => {
  const columnas = [];
  const valores = [];
  let index = 1;

  if (campos.imagen_url) {
    const result = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
    const producto = result.rows[0];

    if (producto && producto.imagen_url) {
      const rutaImagen = path.join(__dirname, '..', producto.imagen_url);
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }
    }
  }

  if (campos.nombre) {
    columnas.push(`nombre = $${index++}`);
    valores.push(campos.nombre);
  }
  if (campos.descripcion) {
    columnas.push(`descripcion = $${index++}`);
    valores.push(campos.descripcion);
  }
  if (campos.precio !== undefined) {
    columnas.push(`precio = $${index++}`);
    valores.push(campos.precio);
  }
  if (campos.stock_actual !== undefined) {
    columnas.push(`stock_actual = $${index++}`);
    valores.push(campos.stock_actual);
  }
  if (campos.stock_minimo !== undefined) {
    columnas.push(`stock_minimo = $${index++}`);
    valores.push(campos.stock_minimo);
  }
  if (campos.categoria_id !== undefined) {
    columnas.push(`categoria_id = $${index++}`);
    valores.push(campos.categoria_id);
  }
  if (campos.imagen_url) {
    columnas.push(`imagen_url = $${index++}`);
    valores.push(campos.imagen_url);
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

// Eliminar producto
const eliminarProducto = async (id) => {
  const result = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
  const producto = result.rows[0];

  if (producto && producto.imagen_url) {
    const rutaImagen = path.join(__dirname, '..', producto.imagen_url);
    if (fs.existsSync(rutaImagen)) {
      fs.unlinkSync(rutaImagen);
    }
  }

  await pool.query('DELETE FROM productos WHERE id = $1', [id]);
};

// Buscar productos por nombre o descripción
const buscarProductos = async (texto) => {
  const query = `
    SELECT * FROM productos
    WHERE LOWER(nombre) LIKE LOWER($1)
       OR LOWER(descripcion) LIKE LOWER($1)
    ORDER BY id DESC`;
  const result = await pool.query(query, [`%${texto}%`]);
  return result.rows;
};

// Filtrar productos por categoría
const obtenerProductosPorCategoria = async (categoriaId) => {
  const query = `
    SELECT * FROM productos
    WHERE categoria_id = $1
    ORDER BY id DESC`;
  const result = await pool.query(query, [categoriaId]);
  return result.rows;
};

// Obtener un producto por ID
const obtenerProductoPorId = async (id) => {
  const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
  return result.rows[0];
};

// Disminuir stock (al realizar un pedido)
const disminuirStock = async (productoId, cantidad) => {
  const result = await pool.query(`
    UPDATE productos
    SET stock_actual = stock_actual - $1
    WHERE id = $2 AND stock_actual >= $1
    RETURNING *
  `, [cantidad, productoId]);

  if (result.rows.length === 0) {
    throw new Error('Stock insuficiente para el producto ID ' + productoId);
  }
};

// Aumentar stock manualmente
const aumentarStock = async (productoId, cantidad) => {
  const result = await pool.query(`
    UPDATE productos
    SET stock_actual = stock_actual + $1
    WHERE id = $2
    RETURNING *
  `, [cantidad, productoId]);

  return result.rows[0];
};

// Obtener productos con stock bajo
const obtenerProductosConStockBajo = async () => {
  const result = await pool.query(`
    SELECT * FROM productos
    WHERE stock_actual <= stock_minimo
    ORDER BY stock_actual ASC
  `);
  return result.rows;
};

// backend/services/productService.js (actualización de funciones)

// ✅ Nueva función segura para actualizar stock directamente
const actualizarStock = async (producto_id, nuevoStock) => {
  const result = await pool.query(
    'UPDATE productos SET stock_actual = $1 WHERE id = $2 RETURNING *',
    [nuevoStock, producto_id]
  );
  return result.rows[0];
};

// ✅ Registrar reposición (corregido para sumar correctamente)
const registrarReposicionStock = async ({ producto_id, cantidad, usuario_id }) => {
  const cantidadNumerica = parseInt(cantidad); // 🔒 Asegurar suma numérica
  if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
    throw new Error('Cantidad inválida para reposición');
  }

  const producto = await pool.query('SELECT stock_actual FROM productos WHERE id = $1', [producto_id]);
  const stockAnterior = producto.rows[0].stock_actual;
  const stockNuevo = stockAnterior + cantidadNumerica;

  // Actualizar stock
  await actualizarStock(producto_id, stockNuevo);

  // Registrar historial
  await pool.query(
    `INSERT INTO historial_reposiciones 
     (producto_id, cantidad_agregada, stock_anterior, stock_nuevo, usuario_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [producto_id, cantidadNumerica, stockAnterior, stockNuevo, usuario_id]
  );
};


// Obtener historial de reposiciones (con stock antes y después)
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


module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  obtenerProductosPorCategoria,
  obtenerProductoPorId,
  disminuirStock,
  aumentarStock,
  obtenerProductosConStockBajo,
  registrarReposicionStock,
  obtenerHistorialReposiciones,
  actualizarStock
};
