//backend/routes/opcionesEntrega.js

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/metodos_pago', async (req, res) => {
  const result = await db.query('SELECT * FROM metodos_pago');
  res.json(result.rows);
});

router.get('/zonas_entrega', async (req, res) => {
  const result = await db.query('SELECT * FROM zonas_entrega');
  res.json(result.rows);
});

router.get('/horarios_entrega', async (req, res) => {
  const result = await db.query('SELECT * FROM horarios_entrega');
  res.json(result.rows);
});

router.get('/metodos_entrega', async (req, res) => {
  const result = await db.query('SELECT * FROM metodos_entrega');
  res.json(result.rows);
});

module.exports = router;
