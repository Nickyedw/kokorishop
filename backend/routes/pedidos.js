// backend/routes/pedidos.js
const express = require('express');
const router = express.Router();

// ✅ Usamos getClient() para transacciones y query() para lecturas simples
const { getClient, query: dbQuery } = require('../db');
const { verificarTokenAdmin, verificarToken } = require('../middlewares/auth');

const {
  enviarCorreoPedido,
  enviarWhatsappPedidoInicial,
  enviarNotificacionConfirmacionPago,
  enviarNotificacionListoParaEntrega,
  enviarNotificacionPedidoEnviado,
  enviarNotificacionPedidoEntregado,
  enviarAlertaStockBajo,
  enviarCorreoAdminNuevoPedido,
} = require('../services/notificaciones');

const { ESTADOS_PEDIDO } = require('../utils/constants');

/* =========================
   Crear nuevo pedido
   ========================= */
router.post('/', async (req, res) => {
  const {
    usuario_id,
    metodo_pago_id,
    metodo_entrega_id,
    zona_entrega_id,
    horario_entrega_id,
    productos,
    comentario_pago,
  } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'Carrito vacío' });
  }

  const client = await getClient();
  let pedido_id;
  let total = 0;

  try {
    await client.query('BEGIN');

    // Validar stock
    for (const prod of productos) {
      const check = await client.query(
        'SELECT nombre, stock_actual FROM productos WHERE id = $1',
        [prod.producto_id]
      );
      const existente = check.rows[0];
      if (!existente) throw new Error(`Producto ID ${prod.producto_id} no existe`);
      if (existente.stock_actual < prod.cantidad) {
        throw new Error(`Stock insuficiente para "${existente.nombre}". Stock disponible: ${existente.stock_actual}`);
      }
    }

    // Total
    total = productos.reduce(
      (acc, p) => acc + Number(p.precio_unitario) * Number(p.cantidad),
      0
    );

    // Crear pedido
    const pedidoIns = await client.query(
      `INSERT INTO pedidos
        (usuario_id, metodo_pago_id, metodo_entrega_id, zona_entrega_id, horario_entrega_id, total, comentario_pago, fecha, estado)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7, NOW(), 'pendiente')
       RETURNING id`,
      [
        usuario_id,
        metodo_pago_id || null,
        metodo_entrega_id || null,
        zona_entrega_id || null,
        horario_entrega_id || null,
        total,
        comentario_pago || null,
      ]
    );
    pedido_id = pedidoIns.rows[0].id;

    // Detalle + stock
    for (const prod of productos) {
      const subtotal = Number(prod.precio_unitario) * Number(prod.cantidad);

      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [pedido_id, prod.producto_id, prod.cantidad, prod.precio_unitario, subtotal]
      );

      await client.query(
        `UPDATE productos
           SET stock_actual = stock_actual - $1
         WHERE id = $2`,
        [prod.cantidad, prod.producto_id]
      );

      // alerta de stock bajo (permitimos dentro de la tx, pero capturamos errores)
      try {
        const stockCheck = await client.query(
          `SELECT nombre, stock_actual, stock_minimo FROM productos WHERE id = $1`,
          [prod.producto_id]
        );
        const { nombre, stock_actual, stock_minimo } = stockCheck.rows[0] || {};
        if (stock_actual < stock_minimo) {
          await enviarAlertaStockBajo(nombre, stock_actual, stock_minimo);
        }
      } catch (nerr) {
        console.warn('⚠️ No se pudo enviar alerta de stock bajo:', nerr.message);
      }
    }

    // ✅ Cerramos la transacción antes de notificar
    await client.query('COMMIT');

    // ✅ Respondemos al cliente inmediatamente
    res.status(201).json({ mensaje: 'Pedido registrado correctamente', pedido_id });

  // 🔔 Notificaciones fuera de banda (no bloquean la respuesta)
  setImmediate(async () => {
    try {
      // Datos del usuario
      const usuarioRes = await dbQuery(
        'SELECT nombre_completo, correo, telefono FROM usuarios WHERE id = $1',
        [usuario_id]
      );
      const usuario = usuarioRes.rows[0] || { nombre_completo: '', correo: '', telefono: '' };

      // Ítems del pedido (con nombres de productos)
      const det = await dbQuery(
        `SELECT d.cantidad, d.precio_unitario, pr.nombre
          FROM detalle_pedido d
          JOIN productos pr ON pr.id = d.producto_id
          WHERE d.pedido_id = $1
          ORDER BY d.id`,
        [pedido_id]
      );

      // Campos descriptivos de pago/entrega (opcionales)
      const pago = metodo_pago_id
        ? (await dbQuery('SELECT nombre FROM metodos_pago WHERE id=$1', [metodo_pago_id])).rows[0]?.nombre
        : null;

      const entrega = metodo_entrega_id
        ? (await dbQuery('SELECT descripcion FROM metodos_entrega WHERE id=$1', [metodo_entrega_id])).rows[0]?.descripcion
        : null;

      const zona = zona_entrega_id
        ? (await dbQuery('SELECT nombre_zona FROM zonas_entrega WHERE id=$1', [zona_entrega_id])).rows[0]?.nombre_zona
        : null;

      const horario = horario_entrega_id
        ? (await dbQuery('SELECT hora_inicio FROM horarios_entrega WHERE id=$1', [horario_entrega_id])).rows[0]?.hora_inicio
        : null;

      const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

      // 👉 Correo al cliente (lo que ya tenías)
      try { await enviarCorreoPedido(usuario.correo, usuario.nombre_completo, pedido_id); }
      catch (e) { console.warn('⚠️ No se pudo enviar correo de pedido al cliente:', e.message); }

      // 👉 WhatsApp al cliente (lo que ya tenías)
      try { await enviarWhatsappPedidoInicial(usuario.telefono, usuario.nombre_completo, pedido_id, fecha, total); }
      catch (e) { console.warn('⚠️ No se pudo enviar WhatsApp inicial:', e.message); }

      // 👉 Nuevo: correo resumen al/los admin(s)
      try {
        await enviarCorreoAdminNuevoPedido({
          pedido_id,
          fecha,
          total,
          usuario,
          items: det.rows.map(r => ({
            nombre: r.nombre,
            cantidad: Number(r.cantidad),
            precio_unitario: Number(r.precio_unitario),
          })),
          metodo_pago: pago || null,
          metodo_entrega: entrega || null,
          zona: zona || null,
          horario: horario || null,
        });
      } catch (e) {
        console.warn('⚠️ No se pudo enviar correo admin:', e.message);
      }
    } catch (postErr) {
      console.warn('⚠️ Error en notificaciones post-commit:', postErr.message);
    }
  });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {/* noop */ }
    console.error('❌ Error al registrar pedido:', error);
    res.status(500).json({ error: 'Error del servidor', detail: error.message });
  } finally {
    client.release();
  }
});


/* =========================
   Listar pedidos (ADMIN)
   - opcionales: ?usuario_id=, ?estado=,
                 ?zona_entrega_id=, ?horario_entrega_id=
   - si no mandas usuario_id, lista TODOS
   ========================= */
const adminListHandler = async (req, res) => {
  try {
    const q = (k) => {
      const v = (req.query[k] ?? '').toString().trim();
      return v === '' ? null : v;
    };
    const toInt = (v) => (v == null ? null : Number.parseInt(v, 10));

    const usuarioId        = toInt(q('usuario_id'));
    const estado           = q('estado');
    const zonaEntregaId    = toInt(q('zona_entrega_id'));
    const horarioEntregaId = toInt(q('horario_entrega_id'));

    const whereParts = [];
    const params = [];

    if (Number.isInteger(usuarioId)) {
      params.push(usuarioId);
      whereParts.push(`p.usuario_id = $${params.length}`);
    }
    if (Number.isInteger(zonaEntregaId)) {
      params.push(zonaEntregaId);
      whereParts.push(`p.zona_entrega_id = $${params.length}`);
    }
    if (Number.isInteger(horarioEntregaId)) {
      params.push(horarioEntregaId);
      whereParts.push(`p.horario_entrega_id = $${params.length}`);
    }
    if (estado) {
      params.push(estado);
      whereParts.push(`p.estado = $${params.length}`);
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const pedidosRes = await dbQuery(
      `SELECT p.*,
              u.nombre_completo AS cliente,
              m.nombre AS metodo_pago
         FROM pedidos p
         JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN metodos_pago m ON p.metodo_pago_id = m.id
        ${where}
     ORDER BY p.fecha DESC`,
      params
    );

    const pedidos = pedidosRes.rows;
    if (!pedidos.length) return res.json([]);

    const ids = pedidos.map((p) => p.id);
    const detallesRes = await dbQuery(
      `SELECT d.*,
              pr.nombre     AS producto_nombre,
              pr.imagen_url AS producto_imagen_url
         FROM detalle_pedido d
         JOIN productos pr ON d.producto_id = pr.id
        WHERE d.pedido_id = ANY($1::int[])
     ORDER BY d.pedido_id, d.id`,
      [ids]
    );

    const detallesPorPedido = new Map();
    for (const d of detallesRes.rows) {
      if (!detallesPorPedido.has(d.pedido_id)) detallesPorPedido.set(d.pedido_id, []);
      detallesPorPedido.get(d.pedido_id).push(d);
    }

    const respuesta = pedidos.map((p) => ({
      ...p,
      productos: detallesPorPedido.get(p.id) || [],
    }));

    res.json(respuesta);
  } catch (error) {
    console.error('❌ Error (admin) al obtener pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Montaje de rutas admin (compat + explícita)
router.get('/',      verificarTokenAdmin, adminListHandler);
router.get('/admin', verificarTokenAdmin, adminListHandler);


// 👇 Pedidos del usuario autenticado (cliente)
router.get('/mis', verificarToken, async (req, res) => {
  const usuario_id = req.usuario.usuario_id;

  try {
    const pedidosRes = await dbQuery(
      `SELECT p.*, u.nombre_completo AS cliente, m.nombre AS metodo_pago
         FROM pedidos p
         JOIN usuarios u ON p.usuario_id = u.id
         JOIN metodos_pago m ON p.metodo_pago_id = m.id
        WHERE p.usuario_id = $1
        ORDER BY p.fecha DESC`,
      [usuario_id]
    );

    const pedidos = pedidosRes.rows;
    if (!pedidos.length) return res.json([]);

    const ids = pedidos.map(p => p.id);

    const detallesRes = await dbQuery(
      `SELECT d.*, pr.nombre AS producto_nombre, pr.imagen_url AS producto_imagen_url
         FROM detalle_pedido d
         JOIN productos pr ON d.producto_id = pr.id
        WHERE d.pedido_id = ANY($1::int[])
        ORDER BY d.pedido_id, d.id`,
      [ids]
    );

    const map = new Map();
    for (const d of detallesRes.rows) {
      if (!map.has(d.pedido_id)) map.set(d.pedido_id, []);
      map.get(d.pedido_id).push(d);
    }

    res.json(pedidos.map(p => ({ ...p, productos: map.get(p.id) || [] })));
  } catch (e) {
    console.error('❌ Error al obtener mis pedidos:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/* =========================
   Obtener pedido por ID
   ========================= */
router.get('/:id', async (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);

  try {
    const pedidoRes = await dbQuery(
      `SELECT p.*, u.nombre_completo AS cliente
         FROM pedidos p
         JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.id = $1`,
      [pedidoId]
    );
    if (!pedidoRes.rows.length) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const detallesRes = await dbQuery(
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


/* =========================
   Actualizar estado de pedido
   ========================= */
router.put('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await dbQuery('UPDATE pedidos SET estado = $1 WHERE id = $2', [estado, id]);

    const resultado = await dbQuery(
      `
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
    `,
      [id]
    );

    const pedido = resultado.rows[0];
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    try {
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
    } catch (nerr) {
      console.warn('⚠️ Error al enviar notificación de estado:', nerr.message);
    }

    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/* =========================
   Eliminar pedido
   ========================= */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbQuery('DELETE FROM pedidos WHERE id = $1', [id]);
    res.json({ mensaje: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// 🟢 Confirmar pago manualmente (solo admin)
router.put('/:id/confirmar-pago', verificarTokenAdmin, async (req, res) => {
  const pedidoId = Number(req.params.id || 0);
  try {
    const upd = await dbQuery(
      `UPDATE pedidos
        SET pago_confirmado = TRUE,
            fecha_confirmacion_pago = NOW(),
            estado = CASE
                        WHEN estado IS NULL OR estado = '' OR estado = 'pendiente'
                        THEN 'pago confirmado' ELSE estado
                      END
      WHERE id = $1
        AND (pago_confirmado IS DISTINCT FROM TRUE)
      RETURNING id, usuario_id`,
      [pedidoId]
    );

    if (upd.rowCount === 0) {
      const exists = await dbQuery('SELECT id, pago_confirmado FROM pedidos WHERE id=$1', [pedidoId]);
      if (!exists.rowCount) return res.status(404).json({ message: 'Pedido no encontrado' });
      return res.status(409).json({ message: 'El pago ya estaba confirmado' });
    }

    const info = await dbQuery(
      `SELECT p.id AS numero_pedido,
              u.nombre_completo AS nombre_cliente,
              u.correo AS correo_cliente,
              u.telefono
         FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
        WHERE p.id = $1`,
      [pedidoId]
    );
    const payload = info.rows[0];

    try { await enviarNotificacionConfirmacionPago(payload); }
    catch (e) { console.warn('⚠️ No se pudo enviar notificación de confirmación:', e.message); }

    return res.json({ message: 'Pago confirmado', pedido_id: pedidoId });
  } catch (error) {
    console.error('❌ Error al confirmar pago:', error);
    return res.status(500).json({ message: 'Error interno del servidor', detail: error.message });
  }
});

module.exports = router;
