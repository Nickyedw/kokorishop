// app.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const { query } = require("./db");

const { verifyMailer, sendMail } = require("./services/mailer");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1);

// ✅ IMPORTANTE: servir uploads desde disco persistente si existe
// En Render configura: UPLOADS_DIR=/var/data/uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "uploads");

console.log("📦 UPLOADS_DIR =>", UPLOADS_DIR);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de autenticación. Intenta más tarde." },
});

/* =========================
   CORS
   ========================= */
const extraOrigins = [
  "https://kokorishop.vercel.app",
  "https://kokorishop.com",
  "https://www.kokorishop.com",
];

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(extraOrigins);

console.log("[CORS] allowedOrigins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const isAllowed = allowedOrigins.includes(origin);
      if (isAllowed) return cb(null, true);
      console.error("[CORS] origin NO permitido:", origin, "allowed:", allowedOrigins);
      return cb(new Error("CORS: origin no permitido: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.options(/.*/, cors());

/* =========================
   Middlewares
   ========================= */
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   Estáticos
   ========================= */
// ✅ CAMBIO CLAVE: servir /uploads desde UPLOADS_DIR (persistente)
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    maxAge: "7d",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

app.use("/pdfs", express.static(path.join(__dirname, "pdfs"), { maxAge: "1d" }));
app.use("/assets", express.static(path.join(__dirname, "assets"), { maxAge: "30d" }));

/* =========================
   Depuración
   ========================= */
app.use((req, _res, next) => {
  console.log("DEBUG", req.method, req.url);
  next();
});

/* =========================
   Rutas API
   ========================= */
app.use("/api/auth/", authLimiter);

const authRoutes = require("./routes/auth");
const productosRouter = require("./routes/productos");
const pedidosRouter = require("./routes/pedidos");
const comprobanteRoutes = require("./routes/comprobantes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const opcionesEntregaRoutes = require("./routes/opcionesEntrega");
const usuariosRouter = require("./routes/usuarios");
const metodosPago = require("./routes/metodosPago");
const notificacionesRouter = require("./routes/notificaciones.router");

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/productos", productosRouter);
app.use("/productos", productosRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/comprobantes", comprobanteRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api", opcionesEntregaRoutes);
app.use("/api/metodos_pago", metodosPago);
app.use("/api/notificaciones", notificacionesRouter);

/* =========================
   Health / Root
   ========================= */
app.get("/", (_req, res) => res.send("🚀 API funcionando correctamente"));
app.get("/health", (_req, res) => res.status(200).json({ ok: true, ts: Date.now() }));

app.get("/health/db", async (_req, res) => {
  try {
    const { rows } = await query("SELECT NOW() as now");
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/health/email", async (_req, res) => {
  try {
    const prefer = (process.env.EMAIL_TRANSPORT || "auto").toLowerCase();
    if (prefer === "brevo_api") return res.json({ ok: true, transport: "brevo_api" });

    const ok = await verifyMailer();
    if (ok) return res.json({ ok: true, transport: "smtp" });
    return res.status(500).json({ ok: false, transport: "smtp" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   📧 PRUEBA DE CORREO
   ========================= */
app.get("/test/email", async (req, res) => {
  const to =
    req.query.to ||
    process.env.EMAIL_TEST_TO ||
    process.env.EMAIL_FROM_ADDR ||
    process.env.SMTP_USER;

  try {
    await sendMail({
      to,
      subject: "🔔 Prueba de correo (KokoriShop)",
      html: `<h2>Prueba OK</h2>
             <p>Transport: <b>${(process.env.EMAIL_TRANSPORT || "auto").toLowerCase()}</b></p>
             <small>${new Date().toISOString()}</small>`,
      text: `Prueba OK - ${new Date().toISOString()}`,
    });
    res.json({ ok: true, to });
  } catch (e) {
    console.error("❌ Test email error:", e.response?.data || e.message);
    res.status(500).json({ ok: false, error: e.message, details: e.response?.data });
  }
});

app.post("/test/email", async (req, res) => {
  const to =
    req.body?.to ||
    process.env.EMAIL_TEST_TO ||
    process.env.EMAIL_FROM_ADDR ||
    process.env.SMTP_USER;

  try {
    await sendMail({
      to,
      subject: "🔔 Prueba de correo (KokoriShop)",
      html: `<p>Prueba OK por POST</p><small>${new Date().toISOString()}</small>`,
      text: `Prueba OK por POST - ${new Date().toISOString()}`,
    });
    res.json({ ok: true, to });
  } catch (e) {
    console.error("❌ Test email POST error:", e.response?.data || e.message);
    res.status(500).json({ ok: false, error: e.message, details: e.response?.data });
  }
});

/* =========================
   404 y errores
   ========================= */
app.use((req, res) => res.status(404).json({ mensaje: "Ruta no encontrada" }));

app.use((err, req, res, next) => {
  void next;
  console.error("❌ Error global:", err);
  if (
    err.name === "MulterError" ||
    (typeof err.message === "string" &&
      (err.message.includes("archivo") || err.message.includes("Solo se permiten")))
  ) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Error del servidor: " + (err.message || "desconocido") });
});

/* =========================
   Arranque
   ========================= */
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ Servidor backend corriendo en puerto ${PORT}`);
  try {
    const prefer = (process.env.EMAIL_TRANSPORT || "auto").toLowerCase();
    if (prefer !== "brevo_api") await verifyMailer();
  } catch (e) {
    console.warn("⚠️ Verificación de correo falló:", e.message);
  }
});
