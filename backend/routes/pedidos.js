//backend/routes/pedidos.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken } = require('../middlewares/auth');

const {
  enviarCorreoPedido,
  enviarWhatsappPedidoInicial,
  enviarNotificacionConfirmacionPago,
  enviarNotificacionListoParaEntrega,
  enviarNotificacionPedidoEnviado,
  enviarNotificacionPedidoEntregado,
  enviarAlertaStockBajo
} = require('../services/notificaciones');
const { ESTADOS_PEDIDO } = require('../utils/constants');

// 🟢 Crear nuevo pedido
router.post('/', async (req, res) => {
  const {
    usuario_id,
    metodo_pago_id,
    metodo_entrega_id,
    zona_entrega_id,
    horario_entrega_id,
    productos,
    comentario_pago
  } = req.body;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 🔒 Validar stock suficiente por cada producto antes de continuar
    for (const producto of productos) {
      const check = await client.query(
        `SELECT nombre, stock_actual FROM productos WHERE id = $1`,
        [producto.producto_id]
      );
      const existente = check.rows[0];
      if (!existente) {
        throw new Error(`Producto ID ${producto.producto_id} no existe`);
      }
      if (existente.stock_actual < producto.cantidad) {
        throw new Error(`Stock insuficiente para "${existente.nombre}". Stock disponible: ${existente.stock_actual}`);
      }
    }

    let total = 0;
    productos.forEach(p => {
      total += p.precio_unitario * p.cantidad;
    });

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (usuario_id, metodo_pago_id, metodo_entrega_id, zona_entrega_id, horario_entrega_id, total, comentario_pago)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [usuario_id, metodo_pago_id, metodo_entrega_id, zona_entrega_id, horario_entrega_id, total, comentario_pago]
    );

    const pedido_id = pedidoResult.rows[0].id;

    for (const producto of productos) {
      const subtotal = producto.precio_unitario * producto.cantidad;

      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedido_id, producto.producto_id, producto.cantidad, producto.precio_unitario, subtotal]
      );

      await client.query(
        `UPDATE productos
         SET stock_actual = stock_actual - $1
         WHERE id = $2`,
        [producto.cantidad, producto.producto_id]
      );

      const stockCheck = await client.query(
        `SELECT nombre, stock_actual, stock_minimo FROM productos WHERE id = $1`,
        [producto.producto_id]
      );

      const { nombre, stock_actual, stock_minimo } = stockCheck.rows[0];
      if (stock_actual < stock_minimo) {
        console.warn(`⚠️ Producto con poco stock: ${nombre} (Stock actual: ${stock_actual})`);
        await enviarAlertaStockBajo(nombre, stock_actual, stock_minimo);
      }
    }

    const usuarioResult = await client.query(
      'SELECT nombre_completo, correo, telefono FROM usuarios WHERE id = $1',
      [usuario_id]
    );

    const usuario = usuarioResult.rows[0];
    const fecha = new Date().toLocaleDateString();

    await enviarCorreoPedido(usuario.correo, usuario.nombre_completo, pedido_id);
    await enviarWhatsappPedidoInicial(usuario.telefono, usuario.nombre_completo, pedido_id, fecha, total);

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Pedido registrado correctamente', pedido_id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al registrar pedido:', error);
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 🟢 Listar pedidos (por usuario o por estado si se desea)
router.get('/', verificarToken, async (req, res) => {
  const { estado } = req.query;
  const usuario_id = req.usuario.usuario_id;
  const es_admin = req.usuario.es_admin;

  let filtros = [];
  let valores = [];

  // Solo filtrar por usuario si NO es admin
  if (!es_admin) {
    filtros.push(`p.usuario_id = $1`);
    valores.push(usuario_id);
  }

  // Si hay estado, agregarlo al filtro
  if (estado) {
    filtros.push(`p.estado = $${valores.length + 1}`);
    valores.push(estado);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

    try {
    const pedidosRes = await db.query(
      `SELECT p.*, u.nombre_completo AS cliente, m.nombre AS metodo_pago
       FROM pedidos p
       JOIN usuarios u ON p.usuario_id = u.id
       JOIN metodos_pago m ON p.metodo_pago_id = m.id
       ${where}
       ORDER BY p.fecha DESC`,
      valores
    );

    const pedidos = pedidosRes.rows;
    if (pedidos.length === 0) return res.json([]);

    // ids de los pedidos devueltos
    const ids = pedidos.map(p => p.id);

    // 👉 Trae SOLO los detalles de esos pedidos + imagen
    const detallesRes = await db.query(
      `SELECT d.*, pr.nombre AS producto_nombre, pr.imagen_url AS producto_imagen_url
       FROM detalle_pedido d
       JOIN productos pr ON d.producto_id = pr.id
       WHERE d.pedido_id = ANY($1::int[])
       ORDER BY d.pedido_id, d.id`,
      [ids]
    );

    // agrupar por pedido
    const detallesPorPedido = new Map();
    for (const d of detallesRes.rows) {
      if (!detallesPorPedido.has(d.pedido_id)) detallesPorPedido.set(d.pedido_id, []);
      detallesPorPedido.get(d.pedido_id).push(d);
    }

    const respuesta = pedidos.map(p => ({
      ...p,
      productos: detallesPorPedido.get(p.id) || []
    }));

    res.json(respuesta);
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// 🟢 Obtener pedido por ID
router.get('/:id', async (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);

  try {
    const pedidoRes = await db.query(
      `SELECT p.*, u.nombre_completo AS cliente
       FROM pedidos p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = $1`,
      [pedidoId]
    );
    if (pedidoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const detallesRes = await db.query(
      `SELECT d.*, pr.nombre AS producto_nombre, pr.imagen_url AS producto_imagen_url
       FROM detalle_pedido d
       JOIN productos pr ON d.producto_id = pr.id
       WHERE d.pedido_id = $1
       ORDER BY d.id`,
      [pedidoId]
    );

    res.json({ ...pedidoRes.rows[0], productos: detallesRes.rows });
  } catch (error) {
    console.error('❌ Error al obtener pedido por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// 🟢 Actualizar estado de pedido
router.put('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [estado, id]);

    const resultado = await db.query(`
      SELECT 
        p.*, 
        p.id AS numero_pedido,
        u.nombre_completo AS nombre_cliente, 
        u.correo AS correo_cliente, 
        u.telefono,
        z.nombre_zona AS zona_entrega_nombre,
        h.hora_inicio AS horario_entrega_texto,
        me.descripcion AS metodo_entrega_nombre
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN zonas_entrega z ON p.zona_entrega_id = z.id
      LEFT JOIN horarios_entrega h ON p.horario_entrega_id = h.id
      LEFT JOIN metodos_entrega me ON p.metodo_entrega_id = me.id
      WHERE p.id = $1
    `, [id]);

    const pedido = resultado.rows[0];

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    switch (estado) {
      case ESTADOS_PEDIDO.PAGO_CONFIRMADO:
        await enviarNotificacionConfirmacionPago(pedido);
        break;
      case ESTADOS_PEDIDO.LISTO_ENTREGA:
        await enviarNotificacionListoParaEntrega(pedido);
        break;
      case ESTADOS_PEDIDO.ENVIADO:
        await enviarNotificacionPedidoEnviado(pedido);
        break;
      case ESTADOS_PEDIDO.ENTREGADO:
        await enviarNotificacionPedidoEntregado(pedido);
        break;
      default:
        console.log('🔔 Estado sin acción especial');
    }

    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🟢 Confirmar pago manualmente
router.put('/:id/confirmar-pago', async (req, res) => {
  const pedidoId = req.params.id;
  const fecha = new Date();

  try {
    const updateResult = await db.query(
      `UPDATE pedidos SET pago_confirmado = TRUE, fecha_confirmacion_pago = $1 
       WHERE id = $2 RETURNING *`,
      [fecha, pedidoId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const infoResult = await db.query(
      `SELECT p.id AS numero_pedido, u.nombre_completo AS nombre_cliente, u.correo AS correo_cliente, u.telefono
       FROM pedidos p
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1`,
      [pedidoId]
    );

    const pedido = infoResult.rows[0];

    await enviarNotificacionConfirmacionPago(pedido);
    res.json({ message: 'Pago confirmado y cliente notificado', pedido });
  } catch (error) {
    console.error('❌ Error al confirmar pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 🟢 Eliminar pedido
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM pedidos WHERE id = $1', [id]);
    res.json({ mensaje: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
