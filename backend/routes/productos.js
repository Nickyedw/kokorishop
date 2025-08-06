// backend/routes/productos.js
const express = require('express');
const router = express.Router();
const subirImagen = require('../middlewares/uploadMiddleware');
const { verificarToken } = require('../middlewares/auth');
const {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  productosPorCategoria,
  obtenerProductoPorId,
  reponerStock,
  historialReposiciones
} = require('../controllers/productController');

// Rutas principales
router.get('/', listarProductos);                    // Listar todos los productos
router.get('/buscar', buscarProductos);              // Búsqueda por nombre
router.get('/categoria/:id', productosPorCategoria); // Productos por categoría
router.get('/historial-reposiciones', verificarToken, historialReposiciones); // ✅ Mover antes de :id
router.get('/:id', obtenerProductoPorId);            // Obtener producto por id

// Crear y actualizar usan Multer
router.post('/', subirImagen.single('imagen'), crearProducto);
router.put('/:id', subirImagen.single('imagen'), actualizarProducto);
router.delete('/:id', eliminarProducto);

// Reposición de stock
router.post('/:id/reponer', verificarToken, reponerStock);

module.exports = router;
