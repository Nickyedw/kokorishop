// backend/controllers/productController.js

const productService = require('../services/productService');

const listarProductos = async (req, res) => {
  try {
    const productos = await productService.obtenerProductos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener producto por ID (opcional pero recomendable)
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

// Crear producto (con imagen)
const crearProducto = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No se recibieron datos del formulario' });
    }

    let { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    // Validar campos vacíos (después de parsear)
    if (!nombre || !descripcion || !precio || !stock || !categoria_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    precio = parseFloat(precio);
    stock = parseInt(stock);
    categoria_id = parseInt(categoria_id);

    const nuevoProducto = await productService.crearProducto({
      nombre,
      descripcion,
      precio,
      stock,
      categoria_id,
      imagen_url
    });

    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// Actualizar producto (con imagen opcional)
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

    // Conversión de tipos (ten en cuenta string vacío "")
    precio = precio !== '' && precio !== undefined ? parseFloat(precio) : undefined;
    stock = stock !== '' && stock !== undefined ? parseInt(stock) : undefined;
    categoria_id = categoria_id !== '' && categoria_id !== undefined ? parseInt(categoria_id) : undefined;

    // Construcción dinámica del objeto campos
    const campos = {
      ...(nombre && nombre !== '' && { nombre }),
      ...(descripcion && descripcion !== '' && { descripcion }),
      ...(precio !== undefined && { precio }),
      ...(stock !== undefined && { stock }),
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
  productosPorCategoria,
  obtenerProductoPorId,
};
