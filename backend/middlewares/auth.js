// middlewares/auth.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded; // decoded.id, decoded.correo, etc.
    next();
  } catch (error) {
    console.error('❌ Error al verificar token:', error.message);
    return res.status(403).json({ error: 'Token inválido o expirado. Por favor inicia sesión nuevamente.' });
  }
};

module.exports = { verificarToken };
