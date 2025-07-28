const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const app = express();
require('dotenv').config();


const authRoutes = require('./routes/auth');
const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');
const comprobanteRoutes = require('./routes/comprobantes');
const categoriaRoutes = require('./routes/categoriaRoutes');

const PORT = process.env.PORT || 3001;

// ✅ Middlewares generales
app.use(cors());
app.use(morgan('dev'));
app.use(express.json()); // ⬅️ Muy importante que esté antes de las rutas
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Middleware de depuración
app.use((req, res, next) => {
  console.log('DEBUG middleware global');
  console.log('url:', req.url);
  console.log('headers:', req.headers);
  next();
});

// ✅ Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRouter);
app.use('/productos', productosRouter); // Extra
app.use('/api/pedidos', pedidosRouter);
app.use('/comprobantes', comprobanteRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/categorias', categoriaRoutes); // Extra

// ✅ Ruta base de prueba
app.get('/', (req, res) => {
  res.send('🚀 API funcionando correctamente');
});

// ❌ Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// 🛡️ Manejo global de errores
/* eslint-disable-next-line no-unused-vars */
app.use((err, req, res, _next) => {
  console.error('❌ Error global:', err.message);

  if (err.name === 'MulterError' || err.message.includes('archivo') || err.message.includes('Solo se permiten')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Error del servidor: ' + err.message });
});

// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});
