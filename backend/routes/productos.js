const express = require('express');
const router = express.Router();
const subirImagen = require('../middlewares/uploadMiddleware');
const {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  productosPorCategoria,
  obtenerProductoPorId // <- ¡añadido!
} = require('../controllers/productController');

// Rutas principales
router.get('/', listarProductos);                    // Listar todos los productos
router.get('/buscar', buscarProductos);              // Búsqueda por nombre
router.get('/categoria/:id', productosPorCategoria); // Productos por categoría
router.get('/:id', obtenerProductoPorId);            // Obtener producto por id (opcional pero recomendable)

// Crear y actualizar usan Multer
router.post('/', subirImagen.single('imagen'), crearProducto);
router.put('/:id', subirImagen.single('imagen'), actualizarProducto);

router.delete('/:id', eliminarProducto);

module.exports = router;
