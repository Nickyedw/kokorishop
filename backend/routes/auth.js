// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // conexión a la BD
const nodemailer = require('nodemailer');
const crypto = require('crypto');

/* =========================
   Helper: normalizar teléfonos Perú (+51)
   ========================= */
function normalizarTelefonoPeru(tel) {
  if (!tel) return null;

  let raw = String(tel).trim();

  // Si ya viene con +51 lo dejamos tal cual
  if (raw.startsWith('+51')) return raw;

  // Nos quedamos solo con dígitos
  let digits = raw.replace(/\D/g, '');

  // Si empieza con 51 (ej: 51987654321) quitamos ese 51 inicial
  if (digits.startsWith('51')) {
    digits = digits.slice(2);
  }

  // Quitamos ceros iniciales por si acaso (ej: 0987… → 987…)
  digits = digits.replace(/^0+/, '');

  if (!digits) return null;

  // Armamos el número final
  return `+51${digits}`;
}

// Configura tu correo real o simulado (por consola)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================
   LOGIN
   ========================= */
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Correo no registrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { usuario_id: user.id, es_admin: user.es_admin, email: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre_completo,
        correo: user.correo,
        es_admin: user.es_admin,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* =========================
   REGISTRO NORMAL
   ========================= */
router.post('/register', async (req, res) => {
  let { nombre_completo, correo, telefono, direccion, password } = req.body;

  try {
    const correoFinal = (correo || '').trim().toLowerCase();

    const existe = await db.query('SELECT id FROM usuarios WHERE correo = $1', [correoFinal]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const telefonoNormalizado = normalizarTelefonoPeru(telefono);

    const result = await db.query(
      `INSERT INTO usuarios (nombre_completo, correo, telefono, direccion, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre_completo, correo, es_admin`,
      [nombre_completo, correoFinal, telefonoNormalizado, direccion || null, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { usuario_id: user.id, es_admin: user.es_admin, email: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre_completo,
        correo: user.correo,
        es_admin: user.es_admin,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* =========================
   RECUPERAR PASSWORD
   ========================= */
router.post('/recuperar', async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'Correo requerido' });

  try {
    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await db.query(
      `
      INSERT INTO codigos_recuperacion (correo, codigo, expiracion)
      VALUES ($1, $2, $3)
    `,
      [correo, codigo, expiracion]
    );

    console.log(`📩 Código de recuperación para ${correo}: ${codigo}`);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: correo,
      subject: 'Código de recuperación de contraseña',
      text: `Tu código es: ${codigo}. Válido por 15 minutos.`,
    });

    res.json({ mensaje: 'Código enviado al correo' });
  } catch (err) {
    console.error('❌ Error al enviar código:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* =========================
   REESTABLECER PASSWORD
   ========================= */
router.post('/reestablecer', async (req, res) => {
  const { correo, codigo, nueva_password } = req.body;

  if (!correo || !codigo || !nueva_password) {
    console.log('❌ Faltan datos:', req.body);
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const result = await db.query(
      `
      SELECT * FROM codigos_recuperacion
      WHERE correo = $1
        AND codigo = $2
        AND usado = FALSE
        AND expiracion > NOW()
      ORDER BY id DESC
      LIMIT 1
    `,
      [correo, codigo]
    );

    if (result.rows.length === 0) {
      console.log(
        '❌ Código inválido o expirado para:',
        correo,
        '→ código:',
        codigo
      );
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(nueva_password, 10);

    await db.query(
      `UPDATE usuarios SET password = $1 WHERE correo = $2`,
      [hashedPassword, correo]
    );

    await db.query(
      `UPDATE codigos_recuperacion SET usado = TRUE WHERE id = $1`,
      [result.rows[0].id]
    );

    console.log('✅ Contraseña actualizada correctamente para:', correo);
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('❌ Error interno al reestablecer contraseña:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ======================================================
   REGISTRO DESDE PEDIDO (invitado → crea cuenta)
   POST /api/auth/registro-desde-pedido
   Body:
   {
     nombre_completo,
     email | correo,
     telefono,
     direccion,
     password,
     pedido_id?  // opcional
   }
   ====================================================== */
router.post('/registro-desde-pedido', async (req, res) => {
  try {
    const {
      nombre_completo,
      email,
      correo,
      telefono,
      direccion,
      password,
      pedido_id,
    } = req.body || {};

    const correoFinal = (correo || email || '').trim().toLowerCase();

    if (!nombre_completo || !correoFinal || !password) {
      return res
        .status(400)
        .json({ error: 'Faltan datos obligatorios para el registro.' });
    }

    // Validar si ya existe correo
    const existe = await db.query(
      'SELECT id FROM usuarios WHERE correo = $1',
      [correoFinal]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const telefonoNormalizado = normalizarTelefonoPeru(telefono);

    // Crear usuario
    const result = await db.query(
      `INSERT INTO usuarios (nombre_completo, correo, telefono, direccion, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre_completo, correo, es_admin`,
      [
        nombre_completo,
        correoFinal,
        telefonoNormalizado,
        direccion || null,
        hashedPassword,
      ]
    );

    const user = result.rows[0];

    // Asociar pedido al nuevo usuario (si viene pedido_id)
    if (pedido_id) {
      await db.query(
        `UPDATE pedidos
            SET usuario_id = $1
          WHERE id = $2
            AND (usuario_id IS NULL OR usuario_id = 0)`,
        [user.id, pedido_id]
      );
    }

    const token = jwt.sign(
      { usuario_id: user.id, es_admin: user.es_admin, email: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre_completo: user.nombre_completo,
        email: user.correo,
        es_admin: user.es_admin,
      },
    });
  } catch (err) {
    console.error('❌ Error en registro-desde-pedido:', err);
    res
      .status(500)
      .json({ error: 'Error interno al crear cuenta desde pedido' });
  }
});

module.exports = router;
