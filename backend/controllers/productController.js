//backend/controllers/productController.js

const productService = require('../services/productService');

const listarProductos = async (req, res) => {
  try {
    const productos = await productService.obtenerProductos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    const nuevoProducto = await productService.crearProducto({
      nombre, descripcion, precio, stock, categoria_id, imagen_url
    });

    res.status(201).json(nuevoProducto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    const productoActualizado = await productService.actualizarProducto(id, {
      nombre, descripcion, precio, stock, categoria_id, imagen_url
    });

    res.json(productoActualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await productService.eliminarProducto(id);
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    const productos = await productService.buscarProductosPorNombre(q);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const productosPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const productos = await productService.obtenerProductosPorCategoria(id);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  productosPorCategoria
};
