// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');
const comprobanteRoutes = require('./routes/comprobantes');
const categoriaRoutes = require('./routes/categoriaRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (para imágenes de productos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas principales
app.use('/productos', productosRouter);
app.use('/categorias', categoriaRoutes);
app.use('/comprobantes', comprobanteRoutes);
app.use('/pedidos', pedidosRouter);
app.use('/api/productos', productosRouter);
app.use('/api/categorias', categoriaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('🚀 API funcionando correctamente');
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});
