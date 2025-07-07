const express = require('express');
const router = express.Router();
const { getCategorias } = require('../controllers/categoriaController');

router.get('/', getCategorias); // GET /api/categorias

module.exports = router;
