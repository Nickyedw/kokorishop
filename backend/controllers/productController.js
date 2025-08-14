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

// Actualizar producto completo (nombre, precio, imagen, etc.)
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const body = JSON.parse(JSON.stringify(req.body));
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    console.log('📩 CAMPOS RECIBIDOS:', body);

    const campos = {};

    if (body.nombre?.trim()) campos.nombre = body.nombre;
    if (body.descripcion?.trim()) campos.descripcion = body.descripcion;
    if (body.precio !== undefined && body.precio !== '') campos.precio = parseFloat(body.precio);
    if (body.stock_actual !== undefined && body.stock_actual !== '') campos.stock_actual = parseInt(body.stock_actual);
    if (body.stock_minimo !== undefined && body.stock_minimo !== '') campos.stock_minimo = parseInt(body.stock_minimo);
    if (body.categoria_id !== undefined && body.categoria_id !== '') campos.categoria_id = parseInt(body.categoria_id);
    if (imagen_url) campos.imagen_url = imagen_url;

    // Booleanos (se permiten aquí también por si se usan en formularios completos)
    if ('destacado' in body) {
      campos.destacado = body.destacado === true || body.destacado === 'true';
    }
    if ('en_oferta' in body) {
      campos.en_oferta = body.en_oferta === true || body.en_oferta === 'true';
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const productoActualizado = await productService.actualizarProducto(id, campos);
    res.json(productoActualizado);
  } catch (err) {
    console.error('❌ Error al actualizar producto:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar solo el campo destacado
const actualizarCampoDestacado = async (req, res) => {
  try {
    const { id } = req.params;
    const { destacado } = req.body;

    if (typeof destacado === 'undefined') {
      return res.status(400).json({ error: 'No se proporcionó el campo destacado' });
    }

    const campos = { destacado: destacado === true || destacado === 'true' };
    const actualizado = await productService.actualizarProducto(id, campos);
    res.json(actualizado);
  } catch (err) {
    console.error('❌ Error al actualizar destacado:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar solo el campo en_oferta
const actualizarCampoOferta = async (req, res) => {
  try {
    const { id } = req.params;
    const { en_oferta } = req.body;

    if (typeof en_oferta === 'undefined') {
      return res.status(400).json({ error: 'No se proporcionó el campo en_oferta' });
    }

    const campos = { en_oferta: en_oferta === true || en_oferta === 'true' };
    const actualizado = await productService.actualizarProducto(id, campos);
    res.json(actualizado);
  } catch (err) {
    console.error('❌ Error al actualizar en_oferta:', err.message);
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

// Obtener productos destacados
const productosDestacados = async (req, res) => {
  try {
    const productos = await productService.obtenerProductosDestacados();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos destacados:', error.message);
    res.status(500).json({ error: 'Error al obtener productos destacados' });
  }
};

// Obtener productos más vendidos
const productosMasVendidos = async (req, res) => {
  try {
    const productos = await productService.obtenerProductosMasVendidos();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error.message);
    res.status(500).json({ error: 'Error al obtener productos más vendidos' });
  }
};

const productosEnOferta = async (req, res) => {
  try {
    const productos = await productService.obtenerProductosEnOferta();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos en oferta:', error.message);
    res.status(500).json({ error: 'Error al obtener productos en oferta' });
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
  historialReposiciones,
  productosDestacados,
  productosMasVendidos,
  productosEnOferta,
  actualizarCampoDestacado,
  actualizarCampoOferta
};
