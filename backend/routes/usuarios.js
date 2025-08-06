//backend/routes/usuarios.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');
const { verificarToken, verificarTokenAdmin } = require('../middlewares/auth');

// Registro público
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

// Obtener perfil propio por ID
router.get('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT id, nombre_completo, correo, telefono, direccion FROM usuarios WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Actualizar perfil propio
router.put('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.usuario;

  if (parseInt(id) !== parseInt(usuario_id)) {
    return res.status(403).json({ error: 'Acceso denegado: no puedes modificar otros usuarios' });
  }

  const { nombre_completo, correo, telefono, direccion, password } = req.body;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        `UPDATE usuarios
         SET nombre_completo = $1, correo = $2, telefono = $3, direccion = $4, password = $5
         WHERE id = $6`,
        [nombre_completo, correo, telefono, direccion, hashedPassword, id]
      );
    } else {
      await db.query(
        `UPDATE usuarios
         SET nombre_completo = $1, correo = $2, telefono = $3, direccion = $4
         WHERE id = $5`,
        [nombre_completo, correo, telefono, direccion, id]
      );
    }

    res.json({ mensaje: '✅ Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: '❌ Error al actualizar el perfil' });
  }
});

// 👉 Crear usuario como admin (interno)
router.post('/admin/usuarios', verificarTokenAdmin, async (req, res) => {
  const { nombre_completo, correo, telefono, direccion, password, es_admin } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await db.query(`
      INSERT INTO usuarios (nombre_completo, correo, telefono, direccion, password, es_admin)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [nombre_completo, correo, telefono, direccion, hashedPassword, es_admin || false]);

    res.status(201).json({ id: nuevoUsuario.rows[0].id, mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// 🔍 Obtener todos los usuarios (admin)
router.get('/admin/usuarios', verificarTokenAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, nombre_completo, correo, telefono, direccion, es_admin, creado_en
      FROM usuarios
      ORDER BY creado_en DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// 🗑️ Eliminar usuario (admin) – con restricción de autoeliminación
router.delete('/admin/usuarios/:id', verificarTokenAdmin, async (req, res) => {
  const { id } = req.params;
  const idAdmin = req.usuario.usuario_id;

  if (parseInt(id) === parseInt(idAdmin)) {
    return res.status(403).json({ mensaje: 'No puedes eliminar tu propio usuario administrador' });
  }

  try {
    await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
});

// ✏️ Editar cualquier usuario (admin)
router.put('/admin/usuarios/:id', verificarTokenAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, correo, telefono, direccion, es_admin } = req.body;

  try {
    await db.query(`
      UPDATE usuarios
      SET nombre_completo = $1,
          correo = $2,
          telefono = $3,
          direccion = $4,
          es_admin = $5
      WHERE id = $6
    `, [nombre_completo, correo, telefono, direccion, es_admin, id]);

    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
});

module.exports = router;
