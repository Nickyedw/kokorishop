// routes/metodosPago.js (nuevo archivo si aún no lo tienes)
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nombre, instrucciones, qr_url FROM metodos_pago');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener métodos de pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
