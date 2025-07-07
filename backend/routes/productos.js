const express = require('express');
const router = express.Router();
const subirImagen = require('../middlewares/uploadMiddleware');
const {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  productosPorCategoria
} = require('../controllers/productController');

router.get('/', listarProductos); // Todos los productos
router.get('/buscar', buscarProductos); // Búsqueda por nombre
router.get('/categoria/:id', productosPorCategoria); // Productos por categoría

router.post('/', subirImagen.single('imagen'), crearProducto);
router.put('/:id', subirImagen.single('imagen'), actualizarProducto);
router.delete('/:id', eliminarProducto);

module.exports = router;
