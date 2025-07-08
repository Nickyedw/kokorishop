//backend/services/productService.js

const pool = require('../db');

// Obtener todos los productos ordenados por ID descendente
const obtenerProductos = async () => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id DESC');
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
const actualizarProducto = async (id, { nombre, descripcion, precio, stock, categoria_id, imagen_url }) => {
  const query = `
    UPDATE productos SET
      nombre = $1,
      descripcion = $2,
      precio = $3,
      stock = $4,
      categoria_id = $5,
      imagen_url = COALESCE($6, imagen_url)
    WHERE id = $7
    RETURNING *`;
  const values = [nombre, descripcion, precio, stock, categoria_id, imagen_url, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Eliminar producto
const eliminarProducto = async (id) => {
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

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  obtenerProductosPorCategoria,
};
