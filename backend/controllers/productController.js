// backend/controllers/productController.js
const productService = require('../services/productService');
const pool = require('../db');

// Listar todos los productos
const listarProductos = async (req, res) => {
  try {
    const productos = await productService.obtenerProductos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener producto por ID
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await productService.obtenerProductoPorId(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear nuevo producto
const crearProducto = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No se recibieron datos del formulario' });
    }

    let { nombre, descripcion, precio, stock_actual, stock_minimo, categoria_id } = req.body;
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    if (!nombre || !descripcion || !precio || !stock_actual || !stock_minimo || !categoria_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    precio = parseFloat(precio);
    stock_actual = parseInt(stock_actual);
    stock_minimo = parseInt(stock_minimo);
    categoria_id = parseInt(categoria_id);

    const nuevoProducto = await productService.crearProducto({
      nombre,
      descripcion,
      precio,
      stock_actual,
      stock_minimo,
      categoria_id,
      imagen_url
    });

    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar producto existente
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre, descripcion, precio, stock_actual, stock_minimo, categoria_id } = req.body;
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    precio = precio !== '' && precio !== undefined ? parseFloat(precio) : undefined;
    stock_actual = stock_actual !== '' && stock_actual !== undefined ? parseInt(stock_actual) : undefined;
    stock_minimo = stock_minimo !== '' && stock_minimo !== undefined ? parseInt(stock_minimo) : undefined;
    categoria_id = categoria_id !== '' && categoria_id !== undefined ? parseInt(categoria_id) : undefined;

    const campos = {
      ...(nombre && nombre !== '' && { nombre }),
      ...(descripcion && descripcion !== '' && { descripcion }),
      ...(precio !== undefined && { precio }),
      ...(stock_actual !== undefined && { stock_actual }),
      ...(stock_minimo !== undefined && { stock_minimo }),
      ...(categoria_id !== undefined && { categoria_id }),
      ...(imagen_url && { imagen_url })
    };

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar' });
    }

    const productoActualizado = await productService.actualizarProducto(id, campos);
    res.json(productoActualizado);

  } catch (err) {
    console.error('Error al actualizar producto:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await productService.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await productService.eliminarProducto(id);
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err.message);
    res.status(500).json({ error: 'Error al eliminar producto, puede tener dependencias asociadas' });
  }
};

// Buscar productos
const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    const productos = await productService.buscarProductos(q);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Filtrar por categoría
const productosPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const productos = await productService.obtenerProductosPorCategoria(id);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reponer stock con auditoría
const reponerStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    const cantidadNumerica = parseInt(cantidad);
    const usuario_id = req.usuario?.usuario_id || null;

    if (!cantidad || isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    const producto = await productService.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockAnterior = producto.stock_actual;
    const stockNuevo = stockAnterior + cantidadNumerica;

    await productService.actualizarStock(producto.id, stockNuevo);

    await pool.query(
      `INSERT INTO historial_reposiciones 
      (producto_id, cantidad_agregada, stock_anterior, stock_nuevo, usuario_id)
      VALUES ($1, $2, $3, $4, $5)`,
      [producto.id, cantidadNumerica, stockAnterior, stockNuevo, usuario_id]
    );

    res.json({ mensaje: 'Stock repuesto correctamente' });
  } catch (error) {
    console.error('Error al reponer stock:', error.message);
    res.status(500).json({ error: 'Error al reponer stock' });
  }
};

// Obtener historial de reposiciones
const historialReposiciones = async (req, res) => {
  try {
    const historial = await productService.obtenerHistorialReposiciones();
    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error.message);
    res.status(500).json({ error: 'Error al obtener historial de reposiciones' });
  }
};

module.exports = {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarProductos,
  productosPorCategoria,
  obtenerProductoPorId,
  reponerStock,
  historialReposiciones
};
