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
  historialReposiciones,
  productosMasVendidos,
  productosDestacados,
  productosEnOferta
} = require('../controllers/productController');

const productService = require('../services/productService');

// Rutas principales
router.get('/buscar', buscarProductos);
router.get('/categoria/:id', productosPorCategoria);
router.get('/historial-reposiciones', verificarToken, historialReposiciones);
router.get('/destacados', productosDestacados);
router.get('/mas-vendidos', productosMasVendidos);
router.get('/oferta', productosEnOferta);
router.get('/', listarProductos);
router.get('/:id', obtenerProductoPorId);

// Crear producto (imagen obligatoria)
router.post('/', subirImagen.single('imagen'), crearProducto);

// ✅ Actualizar producto (con o sin imagen)
router.put('/:id', (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    subirImagen.single('imagen')(req, res, next);
  } else if (contentType.includes('application/json')) {
    express.json()(req, res, next);
  } else {
    next();
  }
}, actualizarProducto);

// ✅ Ruta: PUT /:id/en_oferta
// PUT /:id/en_oferta
router.put('/:id/en_oferta', express.json(), async (req, res) => {
  const { id } = req.params;
  const valor = req.body.en_oferta;

  console.log('📥 BODY en_oferta:', req.body); // 👀 Verifica qué llega realmente

  if (typeof valor === 'undefined') {
    return res.status(400).json({ error: 'Campo "en_oferta" es requerido' });
  }

  try {
    const campos = {
      en_oferta: valor === true || valor === 'true'
    };

    console.log('✅ CAMPOS PARA ACTUALIZAR:', campos);

    const actualizado = await productService.actualizarProducto(id, campos);

    res.json(actualizado);
  } catch (error) {
    console.error('❌ Error en PUT /en_oferta:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// ✅ Ruta: PUT /:id/destacado
router.put('/:id/destacado', express.json(), async (req, res) => {
  const { id } = req.params;
  const valor = req.body.destacado;

  if (typeof valor === 'undefined') {
    return res.status(400).json({ error: 'Campo "destacado" es requerido' });
  }

  try {
    const actualizado = await productService.actualizarProducto(id, {
      destacado: valor === true || valor === 'true'
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Eliminar producto
router.delete('/:id', eliminarProducto);

// Reposición de stock
router.post('/:id/reponer', verificarToken, reponerStock);

module.exports = router;
