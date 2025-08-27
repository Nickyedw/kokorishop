// backend/app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Routers
const authRoutes = require('./routes/auth');
const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');
const comprobanteRoutes = require('./routes/comprobantes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const opcionesEntregaRoutes = require('./routes/opcionesEntrega');
const usuariosRouter = require('./routes/usuarios');
const metodosPago = require('./routes/metodosPago');

const PORT = process.env.PORT || 3001;

/* =========================
   Middlewares globales
   ========================= */
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  })
);
// ❌ En Express 5, '*' rompe path-to-regexp. Si quisieras mantenerlo, usa '(.*)':
// app.options('(.*)', cors());

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

/* =========================
   Depuración
   ========================= */
app.use((req, _res, next) => {
  console.log('DEBUG', req.method, req.url);
  next();
});

/* =========================
   Rutas API
   ========================= */
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRouter);

app.use('/api/productos', productosRouter);
app.use('/productos', productosRouter); // alias si lo usas en el front

app.use('/api/pedidos', pedidosRouter);
app.use('/comprobantes', comprobanteRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/categorias', categoriaRoutes); // alias
app.use('/api', opcionesEntregaRoutes);  // mantiene tu prefijo actual
app.use('/api/metodos_pago', metodosPago);

/* =========================
   Health / Root
   ========================= */
app.get('/', (_req, res) => {
  res.send('🚀 API funcionando correctamente');
});
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() });
});

/* =========================
   404 y errores
   ========================= */
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});
/* eslint-disable-next-line no-unused-vars */
app.use((err, req, res, _next) => {
  console.error('❌ Error global:', err);
  if (
    err.name === 'MulterError' ||
    (typeof err.message === 'string' &&
      (err.message.includes('archivo') || err.message.includes('Solo se permiten')))
  ) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Error del servidor: ' + (err.message || 'desconocido') });
});

/* =========================
   Arranque
   ========================= */
app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});
