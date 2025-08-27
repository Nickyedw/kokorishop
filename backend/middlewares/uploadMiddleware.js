// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ────────────────────────────────────────────────────────────
// 1) Asegurar carpeta /uploads/productos
// ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'productos');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ────────────────────────────────────────────────────────────
/**  Helpers  */
// ────────────────────────────────────────────────────────────
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME = new Set(Object.keys(MIME_TO_EXT));

/** Sanea el nombre del archivo (sin espacios, sin tildes, sin símbolos raros) */
function sanitizeBaseName(name) {
  // quita extensión
  const base = name.replace(/\.[^.]+$/, '');
  // normaliza acentos y caracteres no ASCII
  let clean = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')        // tildes
    .replace(/[^a-zA-Z0-9-_]+/g, '-')       // reemplaza separadores
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  if (!clean) clean = 'img';
  return clean;
}

/** Determina extensión "segura" basada en mimetype (si es posible) */
function pickSafeExt(originalname, mimetype) {
  // si el mimetype es conocido, úsalo
  if (ALLOWED_MIME.has(mimetype)) {
    return MIME_TO_EXT[mimetype];
  }
  // fallback a la extensión del nombre original
  const ext = path.extname(originalname).toLowerCase();
  return ALLOWED_EXTS.has(ext) ? ext : '.jpg';
}

// ────────────────────────────────────────────────────────────
// 2) Configuración de Multer
// ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const safeBase = sanitizeBaseName(file.originalname);
    const ext = pickSafeExt(file.originalname, file.mimetype);
    const unique = Date.now(); // puedes combinar con un nanoid si quieres aún menos colisiones
    cb(null, `${unique}-${safeBase}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const mimeOk = ALLOWED_MIME.has(file.mimetype);
  const extOk = ALLOWED_EXTS.has(path.extname(file.originalname).toLowerCase());

  // Aceptamos si pasa cualquiera de las dos validaciones, pero priorizamos mimetype
  if (mimeOk || extOk) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de archivo no permitido. Solo se permiten: ${Array.from(ALLOWED_EXTS).join(', ')}`
      ),
      false
    );
  }
};

const subirImagen = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 6,                  // útil para .array('imagenes', 6)
  },
});

module.exports = subirImagen;
