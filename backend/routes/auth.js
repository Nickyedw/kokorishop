// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Asegúrate de que el archivo exista
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configura tu correo real o simulado (por consola)
const transporter = nodemailer.createTransport({
  service: 'gmail',
    auth: {
    user: process.env.EMAIL_FROM,   
    pass: process.env.EMAIL_PASS   
    }
});

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

    res.json({ token, usuario: { id: user.id, nombre: user.nombre_completo, correo: user.correo, es_admin: user.es_admin } });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de registro
router.post('/register', async (req, res) => {
  const { nombre_completo, correo, telefono, direccion, password } = req.body;

  try {
    const existe = await db.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO usuarios (nombre_completo, correo, telefono, direccion, password)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre_completo, correo, es_admin`,
      [nombre_completo, correo, telefono, direccion, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { usuario_id: user.id, es_admin: user.es_admin },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre_completo,
        correo: user.correo,
        es_admin: user.es_admin
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/recuperar
router.post('/recuperar', async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'Correo requerido' });

  try {
    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await db.query(`
      INSERT INTO codigos_recuperacion (correo, codigo, expiracion)
      VALUES ($1, $2, $3)
    `, [correo, codigo, expiracion]);

    // ENVÍO por consola o Gmail
    console.log(`📩 Código de recuperación para ${correo}: ${codigo}`);
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: correo,
      subject: 'Código de recuperación de contraseña',
      text: `Tu código es: ${codigo}. Válido por 15 minutos.`
    });

    res.json({ mensaje: 'Código enviado al correo' });
  } catch (err) {
    console.error('❌ Error al enviar código:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/auth/reestablecer
router.post('/reestablecer', async (req, res) => {
  const { correo, codigo, nueva_password } = req.body;

  if (!correo || !codigo || !nueva_password) {
    console.log('❌ Faltan datos:', req.body);
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    // Buscar código válido
    const result = await db.query(`
      SELECT * FROM codigos_recuperacion
      WHERE correo = $1 AND codigo = $2 AND usado = FALSE AND expiracion > NOW()
      ORDER BY id DESC LIMIT 1
    `, [correo, codigo]);

    if (result.rows.length === 0) {
      console.log('❌ Código inválido o expirado para:', correo, '→ código:', codigo);
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Hashear nueva contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(nueva_password, 10);

    // Actualizar contraseña del usuario
   await db.query(`UPDATE usuarios SET password = $1 WHERE correo = $2`, [hashedPassword, correo]);

    // Marcar código como usado
   await db.query(`UPDATE codigos_recuperacion SET usado = TRUE WHERE id = $1`, [result.rows[0].id]);

    console.log('✅ Contraseña actualizada correctamente para:', correo);
    res.json({ mensaje: 'Contraseña actualizada correctamente' });

  } catch (err) {
    console.error('❌ Error interno al reestablecer contraseña:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


module.exports = router;
