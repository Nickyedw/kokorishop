const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegura que exista la carpeta uploads/productos
const dir = path.join(__dirname, '..', 'uploads', 'productos');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const subirImagen = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg') {
      return cb(new Error('Solo se permiten imágenes .jpg, .jpeg y .png'));
    }
    cb(null, true);
  },
});

module.exports = subirImagen;
