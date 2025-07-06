const PDFDocument = require('pdfkit'); 
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const db = require('../db');

// =============================================
// 📄 COMPROBANTE A4 ESTILO KAWAII
// =============================================
// Carpeta donde se guardarán los PDF generados
const OUTPUT_DIR = path.join(__dirname, '..', 'pdfs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

async function generarComprobantePDF(pedidoId) {
  try {
    const pedidoResult = await db.query(
      `SELECT p.id, u.nombre_completo AS cliente, p.fecha, p.estado, p.total, u.correo AS correo_cliente
       FROM pedidos p JOIN usuarios u ON p.usuario_id=u.id
       WHERE p.id=$1`, [pedidoId]
    );
    const pedido = pedidoResult.rows[0];
    if (!pedido) throw new Error('Pedido no encontrado');

    const detalleResult = await db.query(
      `SELECT dp.cantidad, dp.precio_unitario, pr.nombre AS nombre_producto
       FROM detalle_pedido dp JOIN productos pr ON dp.producto_id=pr.id
       WHERE dp.pedido_id=$1`, [pedidoId]
    );
    const detalle = detalleResult.rows;

    const qrURL = 'https://nickyedw.github.io/kokoshop/';
    const qrData = await QRCode.toDataURL(qrURL);
    const qrBuffer = Buffer.from(qrData.split(',')[1], 'base64');

    const filename = `comprobante_${pedidoId}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    const kawaiiFont = path.join(__dirname, '../fonts/Gontserrat-Medium.ttf');
    if (fs.existsSync(kawaiiFont)) {
      doc.registerFont('kawaii', kawaiiFont);
      doc.font('kawaii');
    } else {
      doc.font('Helvetica');
    }

    const pageCenter = doc.page.width / 2;
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFF0F5');
    doc.fillColor('#000');

    const logoPath = path.join(__dirname, '../assets/logo_kawaii.png');
    const logoWidth = 100;
    doc.image(logoPath, pageCenter - logoWidth / 2, 50, { width: logoWidth });
    doc.moveDown(10);
    doc.fontSize(22).fillColor('#000').text('COMPROBANTE DEL PEDIDO', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).dash(1, { space: 2 }).strokeColor('#FFB6C1').stroke();
    doc.undash().strokeColor('#000');

    doc.moveDown(1);
    doc.fontSize(12);
    doc.text(`ID del Pedido :  ${pedido.id}`);
    doc.text(`Cliente       :  ${pedido.cliente}`);
    doc.text(`Fecha         :  ${new Date(pedido.fecha).toLocaleString()}`);
    doc.text(`Estado        :  ${pedido.estado}`);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).dash(1, { space: 2 }).strokeColor('#FFB6C1').stroke();
    doc.undash().strokeColor('#000');

    doc.moveDown(1);
    doc.fontSize(13).text('Detalle del Pedido :', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemX = 50;
    const colWidths = { producto: 220, cantidad: 70, precio: 100, subtotal: 100 };

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.rect(itemX, tableTop, 495, 20).fill('#FFE4E1').stroke();
    doc.fillColor('#000');
    doc.text('Descripción', itemX + 5, tableTop + 5);
    doc.text('Cantidad', itemX + colWidths.producto, tableTop + 5);
    doc.text('P. Unitario', itemX + colWidths.producto + colWidths.cantidad, tableTop + 5);
    doc.text('Subtotal', itemX + colWidths.producto + colWidths.cantidad + colWidths.precio, tableTop + 5);

    doc.font('Helvetica').fillColor('#000');
    let total = 0;
    detalle.forEach((item, index) => {
      const y = tableTop + 20 + index * 20;
      const subtotal = item.cantidad * parseFloat(item.precio_unitario);
      total += subtotal;
      doc.rect(itemX, y, 495, 20).fill(index % 2 === 0 ? '#FFF' : '#FFF8FA').stroke();
      doc.fillColor('#000');
      doc.text(item.nombre_producto, itemX + 5, y + 5);
      doc.text(item.cantidad.toString(), itemX + colWidths.producto, y + 5);
      doc.text(`S/ ${parseFloat(item.precio_unitario).toFixed(2)}`, itemX + colWidths.producto + colWidths.cantidad, y + 5);
      doc.text(`S/ ${subtotal.toFixed(2)}`, itemX + colWidths.producto + colWidths.cantidad + colWidths.precio, y + 5);
    });

    const finalY = tableTop + 20 + detalle.length * 20 + 10;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Total: S/ ${total.toFixed(2)}`, 50, finalY, { align: 'right' });

    doc.moveTo(50, finalY + 20).lineTo(545, finalY + 20).dash(1, { space: 2 }).strokeColor('#FFB6C1').stroke();
    doc.undash();
    doc.image(qrBuffer, pageCenter - 50, finalY + 40, { width: 100 });

    doc.moveDown(10);
    doc.fontSize(8).fillColor('#000').text(
      'KokoShop S.R.L. | RUC: 12345678901\n' +
      'Av. Kawaii 123, Lima - Perú\n' +
      'Condiciones: Este comprobante es válido solo para fines informativos.\n' +
      '¡Gracias por tu compra! Vuelve pronto.',
      { align: 'center' }
    );

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filepath));
      stream.on('error', reject);
    });

  } catch (err) {
    console.error('❌ Error generando comprobante PDF:', err);
    throw err;
  }
}

// =============================================
// 🧾 TICKET MINI / IMPRESORA TÉRMICA
// =============================================
async function generarTicketPDF(pedidoId) {
  try {
    const pedidoResult = await db.query(
      `SELECT p.id, u.nombre_completo AS cliente, p.fecha, p.estado, p.total
       FROM pedidos p JOIN usuarios u ON p.usuario_id=u.id
       WHERE p.id=$1`, [pedidoId]
    );
    const pedido = pedidoResult.rows[0];
    if (!pedido) throw new Error('Pedido no encontrado')

    const detalleResult = await db.query(
      `SELECT dp.cantidad, dp.precio_unitario, pr.nombre AS nombre_producto
       FROM detalle_pedido dp JOIN productos pr ON dp.producto_id=pr.id
       WHERE dp.pedido_id=$1`, [pedidoId]
    );
    const detalle = detalleResult.rows;

    const qrURL = 'https://nickyedw.github.io/kokoshop/';
    const qrData = await QRCode.toDataURL(qrURL);
    const qrBuffer = Buffer.from(qrData.split(',')[1], 'base64');

    const ticketDoc = new PDFDocument({
      size: [220, 600], // ≈ 58mm
      margin: 10
    });

    const filename = `ticket_${pedidoId}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const stream = fs.createWriteStream(filepath);
    ticketDoc.pipe(stream);

    const logoPath = path.join(__dirname, '../assets/logo_kawaii.png');
    if (fs.existsSync(logoPath)) {
      ticketDoc.image(logoPath, 60, 10, { width: 100, align: 'center' });
    }

    ticketDoc.moveDown(8);
    ticketDoc.fontSize(10).text('KokoShop S.R.L.', { align: 'center' });
    ticketDoc.fontSize(8).text('RUC: 12345678901', { align: 'center' });
    ticketDoc.text('Av. Kawaii 123, Lima', { align: 'center' });
    ticketDoc.moveDown(0.5);

    ticketDoc.text('--------------------------------------------', { align: 'center' });
    ticketDoc.fontSize(8);
    ticketDoc.text(`PEDIDO #${pedido.id}`);
    ticketDoc.text(`Cliente: ${pedido.cliente}`);
    ticketDoc.text(`Fecha: ${new Date(pedido.fecha).toLocaleString()}`);
    ticketDoc.text(`Estado: ${pedido.estado}`);
    ticketDoc.text('--------------------------------------------', { align: 'center' });

    let total = 0;
    detalle.forEach(item => {
      const subtotal = item.cantidad * parseFloat(item.precio_unitario);
      total += subtotal;
      ticketDoc.text(`${item.cantidad} x ${item.nombre_producto}`);
      ticketDoc.text(`    S/ ${parseFloat(item.precio_unitario).toFixed(2)}  Subt: S/ ${subtotal.toFixed(2)}`);
    });

    ticketDoc.moveDown();
    ticketDoc.font('Helvetica-Bold').text(`TOTAL: S/ ${total.toFixed(2)}`, { align: 'right' });

    ticketDoc.moveDown();
    ticketDoc.image(qrBuffer, { width: 80, align: 'center' });

    ticketDoc.moveDown(1);
    ticketDoc.fontSize(7).font('Helvetica').text(
      '¡Gracias por tu compra! \nSolo válido para fines informativos',
      { align: 'center' }
    );

    ticketDoc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      });

  } catch (err) {
    console.error('❌ Error generando ticket PDF:', err);
    throw err;
  }
}

module.exports = {
  generarComprobantePDF,
  generarTicketPDF
};
