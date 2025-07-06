// routes/pedidos.js
const express = require('express');
//const PDFDocument = require('pdfkit');
const router = express.Router();
const db = require('../db');
//const { generarComprobantePDF } = require('../controllers/comprobante');

//const { verificarToken } = require('../middlewares/auth');
const {
    enviarCorreoPedido,
    enviarWhatsappPedidoInicial,
    enviarNotificacionConfirmacionPago,
    enviarNotificacionListoParaEntrega,
    enviarNotificacionPedidoEnviado,
    enviarNotificacionPedidoEntregado,
  } = require('../services/notificaciones'); // Ajusta ruta si es necesario
  const { ESTADOS_PEDIDO } = require('../utils/constants');

// Crear nuevo pedido
router.post('/', async (req, res) => {
  const {
    usuario_id,
    metodo_pago_id,
    metodo_entrega_id,
    zona_entrega_id,
    horario_entrega_id,
    productos
  } = req.body;

  try {
    let total = 0;
    productos.forEach(p => {
      total += p.precio_unitario * p.cantidad;
    });

    const pedidoResult = await db.query(
      `INSERT INTO pedidos (usuario_id, metodo_pago_id, metodo_entrega_id, zona_entrega_id, horario_entrega_id, total)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [usuario_id, metodo_pago_id, metodo_entrega_id, zona_entrega_id, horario_entrega_id, total]
    );

    const pedido_id = pedidoResult.rows[0].id;

    for (const producto of productos) {
      const subtotal = producto.precio_unitario * producto.cantidad;
      await db.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedido_id, producto.producto_id, producto.cantidad, producto.precio_unitario, subtotal]
      );
    }

  // Obtener correo del usuario
  const usuarioResult = await db.query(
    'SELECT nombre_completo, correo, telefono FROM usuarios WHERE id = $1',
    [usuario_id]
  );
  const usuario = usuarioResult.rows[0];

  // Enviar correo y Whatsapp
  await enviarCorreoPedido(usuario.correo, usuario.nombre_completo, pedido_id);

  console.log('📱 Enviando WhatsApp a:', usuario.telefono);

  //const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fecha = new Date().toLocaleDateString(); // Puedes usar formato más formal si deseas
  //const fecha = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  await enviarWhatsappPedidoInicial(usuario.telefono, usuario.nombre_completo, pedido_id, fecha, total);

    res.status(201).json({ mensaje: 'Pedido registrado correctamente', pedido_id });
  } catch (error) {
    console.error('❌ Error al registrar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }

});

// 1. Listar todos los pedidos con detalles
router.get('/', async (req, res) => {
  const { usuario_id, estado } = req.query;
  let filtros = [];
  let valores = [];

  if (usuario_id) {
    filtros.push(`p.usuario_id = $${valores.length + 1}`);
    valores.push(usuario_id);
  }
  if (estado) {
    filtros.push(`p.estado = $${valores.length + 1}`);
    valores.push(estado);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

  try {
    const pedidos = await db.query(
      `SELECT p.*, u.nombre_completo AS cliente, m.nombre AS metodo_pago
       FROM pedidos p
       JOIN usuarios u ON p.usuario_id = u.id
       JOIN metodos_pago m ON p.metodo_pago_id = m.id
       ${where}
       ORDER BY p.fecha DESC`,
      valores
    );

    const detalles = await db.query(
      `SELECT d.*, pr.nombre AS producto_nombre
       FROM detalle_pedido d
       JOIN productos pr ON d.producto_id = pr.id`
    );

    const respuesta = pedidos.rows.map(pedido => {
      return {
        ...pedido,
        productos: detalles.rows.filter(d => d.pedido_id === pedido.id)
      };
    });

    res.json(respuesta);
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. Obtener pedido por ID
router.get('/:id', async (req, res) => {
  const pedidoId = parseInt(req.params.id);

  try {
    const pedido = await db.query(
      `SELECT p.*, u.nombre_completo AS cliente
       FROM pedidos p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = $1`,
      [pedidoId]
    );

    const detalles = await db.query(
      `SELECT d.*, pr.nombre AS producto_nombre
       FROM detalle_pedido d
       JOIN productos pr ON d.producto_id = pr.id
       WHERE d.pedido_id = $1`,
      [pedidoId]
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ ...pedido.rows[0], productos: detalles.rows });
  } catch (error) {
    console.error('❌ Error al obtener pedido por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// 3. Actualizar estado de un pedido
router.put('/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
  
    try {
        // ✅ Actualizar estado
        await db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [estado, id]);
        console.log(`📦 Pedido #${id} actualizado a estado: ${estado}`);
    
        // ✅ Obtener datos del pedido + cliente
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
    
        const pedido = resultado.rows[0]; // 👈🏽 importante
    
        if (!pedido) {
          console.warn(`⚠️ No se encontró el pedido con ID ${id}`);
          return res.status(404).json({ error: 'Pedido no encontrado' });
        }
  
      // Lógica de notificación según estado
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
          console.log('🔔 Estado no tiene notificación asociada:', estado);
      }
  
      res.json({ mensaje: 'Estado actualizado y notificación enviada si aplicaba.' });
    } catch (error) {
      console.error('❌ Error al actualizar estado o enviar notificación:', error.message);
      res.status(500).json({ error: 'Error al actualizar estado o enviar notificación' });
    }
  });
  
// 4. Eliminar un pedido
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
  
// 5. endpoint para confirmar pago manualmente
router.put('/:id/confirmar-pago', async (req, res) => {
    const pedidoId = req.params.id;
    const fecha = new Date();
  
    try {
      // 1. Actualizar estado de pago
      const updateResult = await db.query(
        `UPDATE pedidos 
         SET pago_confirmado = TRUE, fecha_confirmacion_pago = $1 
         WHERE id = $2 RETURNING *`,
        [fecha, pedidoId]
      );
  
      if (updateResult.rowCount === 0) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }
  
      // 2. Obtener información adicional del pedido y usuario
      const infoResult = await db.query(
        `SELECT p.id AS numero_pedido, u.nombre_completo AS nombre_cliente, u.correo AS correo_cliente, u.telefono
         FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.id = $1`,
        [pedidoId]
      );
  
      const pedido = infoResult.rows[0];
  
      if (!pedido) {
        return res.status(404).json({ message: 'No se encontró información del cliente para notificación' });
      }
  
      // 3. Enviar notificaciones
      await enviarNotificacionConfirmacionPago(pedido);
  
      res.json({ message: 'Pago confirmado y cliente notificado', pedido });
  
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });
  


    
  
module.exports = router;
