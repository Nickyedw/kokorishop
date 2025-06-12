<<<<<<< HEAD
// backend/app.js

=======
>>>>>>> ac039c0 (Backend funcionando: conexión DB y endpoint /notificaciones y AdminPedidos)
require('dotenv').config(); // 👈 Carga variables del archivo .env

const express = require('express');
const cors = require('cors');
const db = require('./db');
const pedidosRouter = require('./routes/pedidos'); // <-- Aquí

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Ruta de prueba: obtener todas las categorías
app.get('/categorias', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categorias');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de prueba: obtener todos los productos
app.get('/productos', async (req, res) => {
  const { categoria_id } = req.query;

  let query = `
    SELECT p.*, c.nombre AS categoria_nombre
    FROM productos p
    JOIN categorias c ON p.categoria_id = c.id
  `;
  const values = [];

  if (categoria_id) {
    query += ' WHERE p.categoria_id = $1';
    values.push(categoria_id);
  }

  try {
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de prueba: obtener todos los productos categoria id
app.get('/productos/categoria/:id', async (req, res) => {
  try {
    const categoriaId = parseInt(req.params.id, 10);

    const result = await db.query(
      `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.categoria_id = $1
      `,
      [categoriaId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener productos por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de prueba: obtener todos los productos buscar
app.get('/productos/buscar', async (req, res) => {
  const { q } = req.query;

  try {
    const result = await db.query(
      `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE LOWER(p.nombre) LIKE LOWER($1)
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al buscar productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas del módulo de pedidos
app.use('/pedidos', pedidosRouter); // ✅ Así todas las rutas internas serán del tipo /pedidos/:id, etc.


app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
