const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db'); // Asegúrate de que el archivo `db.js` esté bien configurado

router.post('/register', async (req, res) => {
  const { nombre_completo, correo, telefono, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO usuarios (nombre_completo, correo, telefono, password) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nombre_completo, correo, telefono, hashed]
    );

    res.status(201).json({ mensaje: 'Usuario registrado', id: result.rows[0].id });
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error.message);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

module.exports = router;
