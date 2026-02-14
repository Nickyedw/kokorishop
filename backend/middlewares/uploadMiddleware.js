// backend/middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ IMPORTANTE: usar disco persistente si existe UPLOADS_DIR
// En Render pon: UPLOADS_DIR=/var/data/uploads
const BASE_UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "uploads");

// Guardamos en /uploads/productos
const UPLOAD_DIR = path.join(BASE_UPLOADS_DIR, "productos");

// ────────────────────────────────────────────────────────────
// 1) Asegurar carpeta
// ────────────────────────────────────────────────────────────
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Carpeta creada:", UPLOAD_DIR);
} else {
  console.log("📁 Carpeta uploads OK:", UPLOAD_DIR);
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_MIME = new Set(Object.keys(MIME_TO_EXT));

function sanitizeBaseName(name) {
  const base = name.replace(/\.[^.]+$/, "");
  let clean = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  if (!clean) clean = "img";
  return clean;
}

function pickSafeExt(originalname, mimetype) {
  if (ALLOWED_MIME.has(mimetype)) return MIME_TO_EXT[mimetype];
  const ext = path.extname(originalname).toLowerCase();
  return ALLOWED_EXTS.has(ext) ? ext : ".jpg";
}

// ────────────────────────────────────────────────────────────
// 2) Configuración de Multer
// ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeBase = sanitizeBaseName(file.originalname);
    const ext = pickSafeExt(file.originalname, file.mimetype);
    const unique = Date.now();
    cb(null, `${unique}-${safeBase}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const mimeOk = ALLOWED_MIME.has(file.mimetype);
  const extOk = ALLOWED_EXTS.has(path.extname(file.originalname).toLowerCase());

  if (mimeOk || extOk) return cb(null, true);

  cb(
    new Error(
      `Tipo de archivo no permitido. Solo se permiten: ${Array.from(ALLOWED_EXTS).join(", ")}`
    ),
    false
  );
};

const subirImagen = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
});

module.exports = subirImagen;
