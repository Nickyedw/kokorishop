const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { query } = require('./db');
const { transporter, verifyMailer} = require('./services/mailer');
verifyMailer(); // loguea si SMTP está OK en el arranque

// ⬇️ NEW: rate limit
const rateLimit = require('express-rate-limit');

const app = express();

// Render/NGINX está detrás de proxy → necesario para que el IP real se detecte
app.set('trust proxy', 1);

// ⬇️ NEW: limitador solo para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 minutos
  max: 100,                          // 100 intentos/ventana por IP
  standardHeaders: true,             // X-RateLimit-*
  legacyHeaders: false,              // desactiva X-RateLimit-* antiguos
  message: { error: 'Demasiadas solicitudes de autenticación. Intenta más tarde.' },
});

/* =========================
   CORS (seguro por dominio)
   ========================= */
const allowedOrigins =
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean); // ej: "https://nickyedw.github.io, http://localhost:5173"

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);               // curl / health
      if (allowedOrigins.length === 0) return cb(null, true); // sin restricción
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: origin no permitido: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  })
);
// Preflight universal sin '*' (Express 5)
app.options(/.*/, cors());

/* =========================
   Middlewares
   ========================= */
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =========================
   Estáticos (producción)
   ========================= */
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);

// Sirve PDF generados y assets del servidor (logos, etc.)
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs'), { maxAge: '1d' }));
app.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: '30d' }));

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
// ⬇️ NEW: aplica el limitador SOLO a /api/auth/*
app.use('/api/auth/', authLimiter);

// Routers
const authRoutes = require('./routes/auth');
const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');
const comprobanteRoutes = require('./routes/comprobantes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const opcionesEntregaRoutes = require('./routes/opcionesEntrega');
const usuariosRouter = require('./routes/usuarios');
const metodosPago = require('./routes/metodosPago');

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
app.get('/', (_req, res) => res.send('🚀 API funcionando correctamente'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, ts: Date.now() }));

app.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await query('SELECT NOW() as now');
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Verificación SMTP (alias /health/smtp)
app.get('/health/smtp', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   404 y errores
   ========================= */
app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));

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
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ Servidor backend corriendo en puerto ${PORT}`);

  // (opcional) verifica SMTP al arrancar sin tumbar el servicio si falla
  try { await verifyMailer(); }
  catch (e) { console.warn('⚠️ SMTP verify falló:', e.message); }
});