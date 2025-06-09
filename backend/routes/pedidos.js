// routes/pedidos.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Crear nuevo pedido
router.post('/pedidos', async (req, res) => {
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

    res.status(201).json({ mensaje: 'Pedido registrado correctamente', pedido_id });
  } catch (error) {
    console.error('❌ Error al registrar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 1. Listar todos los pedidos con detalles
router.get('/pedidos', async (req, res) => {
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
      `SELECT p.*, u.nombre_completo AS cliente, m.descripcion AS metodo_pago
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
router.get('/pedidos/:id', async (req, res) => {
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
router.put('/pedidos/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
  
    try {
      await db.query(
        'UPDATE pedidos SET estado = $1 WHERE id = $2',
        [estado, id]
      );
  
      res.json({ mensaje: 'Estado del pedido actualizado correctamente' });
    } catch (error) {
      console.error('❌ Error al actualizar estado del pedido:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
// 4. Eliminar un pedido
router.delete('/pedidos/:id', async (req, res) => {
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
