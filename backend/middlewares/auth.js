const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ mensaje: 'Token no proporcionado' });
  }

  const tokenLimpio = token.replace('Bearer ', '');

  jwt.verify(tokenLimpio, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }

    req.usuario = decoded; // Puedes acceder a los datos del usuario desde aquí
    next();
  });
};

module.exports = {
  verificarToken,
};
