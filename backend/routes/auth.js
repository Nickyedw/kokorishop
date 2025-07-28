// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Asegúrate de que el archivo exista

// Endpoint de login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Correo no registrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ usuario_id: user.id, es_admin: user.es_admin }, process.env.JWT_SECRET, {
      expiresIn: '2h'
    });

    res.json({ token, usuario: { id: user.id, nombre: user.nombre_completo, correo: user.correo } });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
