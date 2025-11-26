// backend/controllers/categoriaController.js
const pool = require('../db');

/**
 * GET /api/categorias
 * Devuelve:
 * [
 *   { id, nombre, total_productos }
 * ]
 */
const getCategorias = async (_req, res) => {
  try {
    console.log('DEBUG GET /api/categorias');

    const sql = `
      SELECT 
        c.id,
        c.nombre,
        COUNT(p.id)::int AS total_productos
      FROM categorias c
      LEFT JOIN productos p 
        ON p.categoria_id = c.id
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre ASC;
    `;

    console.log('SQL categorias:\n', sql);

    const result = await pool.query(sql);

    console.log('Filas categorías:', result.rows);

    return res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    return res
      .status(500)
      .json({ message: 'Error al obtener categorías' });
  }
};

module.exports = {
  getCategorias,
};
