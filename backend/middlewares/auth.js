// middlewares/auth.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

function extraerToken(req) {
  const raw = req.headers.authorization || req.headers['x-access-token'] || '';
  if (typeof raw !== 'string') return null;
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
}

const verificarToken = (req, res, next) => {
  const token = extraerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // Normalizamos a { usuario_id, es_admin, email? }
    req.usuario = {
      usuario_id: decoded.usuario_id ?? decoded.id,
      es_admin: !!decoded.es_admin,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error('❌ Error al verificar token:', error.message);
    return res
      .status(401)
      .json({ error: 'Token inválido o expirado. Por favor inicia sesión nuevamente.' });
  }
};

const verificarTokenAdmin = (req, res, next) => {
  verificarToken(req, res, () => {
    if (!req.usuario?.es_admin) {
      return res.status(403).json({ mensaje: 'Acceso restringido solo para administradores' });
    }
    next();
  });
};

module.exports = { verificarToken, verificarTokenAdmin };
