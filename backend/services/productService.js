//backend/services/productService.js
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
const crearProducto = async ({ nombre, descripcion, precio, stock, categoria_id, imagen_url }) => {
  const query = `
    INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
  const values = [nombre, descripcion, precio, stock, categoria_id, imagen_url];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Actualizar producto existente
const actualizarProducto = async (id, campos) => {
  const columnas = [];
  const valores = [];
  let index = 1;

  // Si hay nueva imagen, buscar la anterior
  if (campos.imagen_url) {
    const result = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
    const producto = result.rows[0];

    if (producto && producto.imagen_url) {
      const rutaImagen = path.join(__dirname, '..', producto.imagen_url);
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen); // 🗑️ Elimina la imagen anterior del disco
      }
    }
  }

  // Armar la consulta dinámica solo con campos definidos
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
  if (campos.stock !== undefined) {
    columnas.push(`stock = $${index++}`);
    valores.push(campos.stock);
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
  // Obtener primero la imagen del producto (si existe)
  const result = await pool.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
  const producto = result.rows[0];

  // Eliminar archivo físico si hay imagen
  if (producto && producto.imagen_url) {
    const rutaImagen = path.join(__dirname, '..', producto.imagen_url);
    if (fs.existsSync(rutaImagen)) {
      fs.unlinkSync(rutaImagen);
    }
  }

  // Eliminar el producto de la base de datos
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

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  obtenerProductosPorCategoria,
  obtenerProductoPorId,
};
