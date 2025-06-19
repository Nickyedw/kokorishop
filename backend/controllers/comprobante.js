const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../db'); // tu conexión actual con pg Pool

const generarComprobantePDF = async (pedidoId, res) => {
  try {
    // Consulta del pedido
    const pedidoResult = await db.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
    const pedido = pedidoResult.rows[0];

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Consulta del detalle del pedido
    const detalleResult = await db.query(
      `SELECT p.nombre, dp.cantidad, dp.precio_unitario
       FROM detalle_pedido dp
       JOIN productos p ON dp.producto_id = p.id
       WHERE dp.pedido_id = $1`, [pedidoId]
    );
    const detalle = detalleResult.rows;

    // Crear el documento PDF
    const doc = new PDFDocument();
    const nombreArchivo = `comprobante_pedido_${pedidoId}.pdf`;
    const rutaArchivo = path.join(__dirname, '..', 'comprobantes', nombreArchivo);

    // Asegurarse de que el directorio 'comprobantes' exista
    if (!fs.existsSync(path.dirname(rutaArchivo))) {
      fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
    }

    // Crear stream para escribir el PDF
    const stream = fs.createWriteStream(rutaArchivo);
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(20).text('Comprobante de Pedido', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`ID del Pedido: ${pedido.id}`);
    doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleString()}`);
    doc.text(`Estado: ${pedido.estado}`);
    doc.text(`Total: S/ ${pedido.total}`);
    doc.moveDown();

    // Detalle del pedido
    doc.fontSize(14).text('Detalle del Pedido:', { underline: true });
    detalle.forEach(item => {
      doc.fontSize(12).text(`- ${item.nombre} x${item.cantidad} @ S/ ${item.precio_unitario.toFixed(2)}`);
    });

    doc.end();

    stream.on('finish', () => {
      return res.download(rutaArchivo, nombreArchivo); // Envía el PDF como descarga al cliente
    });

  } catch (error) {
    console.error('❌ Error al generar comprobante PDF:', error);
    res.status(500).json({ message: 'Error interno al generar comprobante PDF' });
  }
};

module.exports = { generarComprobantePDF };
