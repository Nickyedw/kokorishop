const pool = require('../db');

const getCategorias = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

module.exports = {
  getCategorias,
};
