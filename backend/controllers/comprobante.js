// backend/controllers/comprobante.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const db = require('../db');

// ======= Utils de salida =======
const OUTPUT_DIR = path.join(__dirname, '..', 'pdfs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// ======= Paleta y helpers =======
const COL = {
  bgPage:     '#FFE7F0', // fondo rosado suave
  sep:        '#FFB4D3', // separadores
  line:       '#FFC2D9', // líneas finas
  text:       '#111111', // texto principal
  tableHeadBg:'#FFE4EC', // encabezado tabla
  tableRowAlt:'#FFF7FA', // fila alterna
};

function niceDate(d) {
  try { return new Date(d).toLocaleString(); }
  catch { return String(d); }
}

// ===========================================================
//  COMPROBANTE A4 — limpio, alineado y sin solapes
// ===========================================================
async function generarComprobantePDF(pedidoId) {
  try {
    // --- datos del pedido
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

    // --- QR
    const qrURL = 'https://nickyedw.github.io/kokorishop/';
    const qrData = await QRCode.toDataURL(qrURL);
    const qrBuffer = Buffer.from(qrData.split(',')[1], 'base64');

    // --- documento
    const filename = `comprobante_${pedidoId}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // --- fondo y tipografía
    const pageW = doc.page.width;
    doc.rect(0, 0, pageW, doc.page.height).fill(COL.bgPage);
    doc.fillColor(COL.text);

    const kawaiiFont = path.join(__dirname, '../fonts/Gontserrat-Medium.ttf');
    if (fs.existsSync(kawaiiFont)) { doc.registerFont('kawaii', kawaiiFont); doc.font('kawaii'); }
    else { doc.font('Helvetica'); }

    // ===== LAYOUT CONTROLADO POR y =====
    let y = 30;

    // ---- LOGO (centrado y con espacio suficiente debajo)
    const logoPath = path.join(__dirname, '../assets/logo_kokorishop.png');
    const logoW = 210; // tamaño más grande
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, (pageW - logoW) / 2, y, { width: logoW });
      y += Math.round(logoW * 0.55) + 44; // más aire bajo el logo
    }

    // --- Título
    doc
      .fontSize(22)
      .fillColor(COL.text)
      .text('COMPROBANTE DEL PEDIDO', 48, y, { width: pageW - 96, align: 'center' });
    y += 28; // más aire bajo el título

    // --- Separador
    doc
      .moveTo(48, y)
      .lineTo(pageW - 48, y)
      .strokeColor(COL.sep)
      .lineWidth(1)
      .dash(1, { space: 2 })
      .stroke()
      .undash();
    y += 20; // espacio extra tras la línea

    // ---- INFO BÁSICA
    doc.fontSize(12).fillColor(COL.text);
    const labelW = 95;
    const lineH  = 18;

    const putRow = (label, value) => {
      doc.font('Helvetica-Bold').text(`${label}:`, 48, y, { width: labelW });
      doc.font('Helvetica').text(String(value ?? '-'), 48 + labelW + 6, y, {
        width: pageW - 48 - (48 + labelW + 6)
      });
      y += lineH;
    };

    putRow('ID del Pedido', pedido.id);
    putRow('Cliente',       pedido.cliente || '-');
    putRow('Fecha',         niceDate(pedido.fecha));
    putRow('Estado',        pedido.estado || '-');

    y += 6;
    drawSep(doc, y, pageW, COL.sep);
    y += 16;

    // ---- DETALLE
    doc.font('Helvetica-Bold').fontSize(13).text('Detalle del Pedido', 48, y);
    y += 12;

    const tableX = 48;
    const tableW = pageW - 96;
    const col = {
      producto: 0.48 * tableW,
      cantidad: 0.14 * tableW,
      precio:   0.18 * tableW,
      subtotal: 0.20 * tableW
    };
    const thH = 22;
    const trH = 20;

    // Header de tabla
    doc.rect(tableX, y, tableW, thH).fill(COL.tableHeadBg)
       .strokeColor(COL.line).lineWidth(0.6).stroke();
    doc.fillColor(COL.text).font('Helvetica-Bold').fontSize(11);
    doc.text('Descripción', tableX + 6, y + 5, { width: col.producto - 12 });
    doc.text('Cantidad',    tableX + col.producto + 6, y + 5, { width: col.cantidad - 12, align: 'center' });
    doc.text('P. Unitario', tableX + col.producto + col.cantidad + 6, y + 5, { width: col.precio - 12, align: 'right' });
    doc.text('Subtotal',    tableX + col.producto + col.cantidad + col.precio + 6, y + 5, { width: col.subtotal - 12, align: 'right' });
    y += thH;

    // Filas
    doc.font('Helvetica').fontSize(11);
    let total = 0;
    detalle.forEach((it, i) => {
      const rowY = y + i * trH;
      const alt  = i % 2 === 1;
      doc.rect(tableX, rowY, tableW, trH)
         .fill(alt ? COL.tableRowAlt : '#FFFFFF')
         .strokeColor(COL.line).lineWidth(0.4).stroke();

      const subtotal = Number(it.cantidad) * Number(it.precio_unitario);
      total += subtotal;

      doc.fillColor(COL.text);
      doc.text(it.nombre_producto, tableX + 6, rowY + 4, { width: col.producto - 12 });
      doc.text(String(it.cantidad), tableX + col.producto, rowY + 4, { width: col.cantidad, align: 'center' });
      doc.text(`S/ ${Number(it.precio_unitario).toFixed(2)}`,
               tableX + col.producto + col.cantidad, rowY + 4, { width: col.precio - 6, align: 'right' });
      doc.text(`S/ ${subtotal.toFixed(2)}`,
               tableX + col.producto + col.cantidad + col.precio, rowY + 4, { width: col.subtotal - 6, align: 'right' });
    });

    y += trH * detalle.length + 8;
    doc.font('Helvetica-Bold').text(`Total: S/ ${total.toFixed(2)}`, tableX, y, { width: tableW, align: 'right' });
    y += 18;

    drawSep(doc, y, pageW, COL.sep);
    y += 22;

    // ---- QR centrado
    const qrW = 130;
    doc.image(qrBuffer, (pageW - qrW) / 2, y, { width: qrW });
    y += qrW + 12;

    // ---- Pie
    doc.font('Helvetica').fontSize(8).fillColor(COL.text).text(
      'KokoriShop S.R.L. | RUC: 12345678901\n' +
      'Av. Kawaii 123, Lima - Perú\n' +
      'Condiciones: Este comprobante es válido solo para fines informativos.\n' +
      '¡Gracias por tu compra! Vuelve pronto.',
      48, y, { width: pageW - 96, align: 'center' }
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

  // ------ helper local ------
  function drawSep(d, yy, w, color) {
    d.moveTo(48, yy).lineTo(w - 48, yy)
     .strokeColor(color).lineWidth(1).dash(1, { space: 2 }).stroke().undash();
  }
}

// ===========================================================
//  TICKET 58 mm – logo centrado y respirado
// ===========================================================
async function generarTicketPDF(pedidoId) {
  try {
    const pedidoResult = await db.query(
      `SELECT p.id, u.nombre_completo AS cliente, p.fecha, p.estado, p.total
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

    // QR
    const qrURL = 'https://nickyedw.github.io/kokorishop/';
    const qrData = await QRCode.toDataURL(qrURL);
    const qrBuffer = Buffer.from(qrData.split(',')[1], 'base64');

    // doc ticket
    const ticketDoc = new PDFDocument({ size: [220, 680], margin: 10 });
    const filename = `ticket_${pedidoId}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const stream = fs.createWriteStream(filepath);
    ticketDoc.pipe(stream);

    let y = 18;

    // logo bn (centrado y respirado)
    const logoBn = path.join(__dirname, '../assets/logo_kokorishop_bn.png');
    if (fs.existsSync(logoBn)) {
      const w = 130;
      ticketDoc.image(logoBn, (220 - w) / 2, y, { width: w });
      y += 68;
    }

    ticketDoc.font('Helvetica').fillColor('#000').fontSize(11)
      .text('KokoriShop S.R.L.', 0, y, { width: 220, align: 'center' });
    y += 14;
    ticketDoc.fontSize(9)
      .text('RUC: 12345678901', 0, y, { width: 220, align: 'center' });
    y += 12;
    ticketDoc.text('Av. Kawaii 123, Lima', 0, y, { width: 220, align: 'center' });
    y += 10;

    // separador
    ticketDoc.moveTo(12, y).lineTo(208, y).strokeColor('#999').lineWidth(0.7).stroke();
    y += 8;

    // cabecera pedido
    ticketDoc.font('Helvetica-Bold').fontSize(10)
      .text(`PEDIDO #${pedido.id}`, 0, y, { width: 220, align: 'center' });
    y += 12;

    ticketDoc.font('Helvetica').fontSize(9);
    const left = 12;
    ticketDoc.text(`Cliente: ${pedido.cliente}`, left, y, { width: 196 });
    y += 12;
    ticketDoc.text(`Fecha: ${niceDate(pedido.fecha)}`, left, y, { width: 196 });
    y += 12;
    ticketDoc.text(`Estado: ${pedido.estado}`, left, y, { width: 196 });
    y += 8;

    ticketDoc.moveTo(12, y).lineTo(208, y).strokeColor('#999').lineWidth(0.7).stroke();
    y += 8;

    // items
    let total = 0;
    detalle.forEach((it) => {
      const subtotal = Number(it.cantidad) * Number(it.precio_unitario);
      total += subtotal;

      ticketDoc.text(`${it.cantidad} x ${it.nombre_producto}`, left, y, { width: 196 });
      y += 12;
      ticketDoc.text(`S/ ${Number(it.precio_unitario).toFixed(2)}   Subt: S/ ${subtotal.toFixed(2)}`, left, y, { width: 196 });
      y += 12;
    });

    // total
    y += 6;
    ticketDoc.font('Helvetica-Bold').fontSize(11)
      .text(`TOTAL: S/ ${total.toFixed(2)}`, 0, y, { width: 220, align: 'right' });
    y += 16;

    // QR centrado + mensaje
    const qrW = 110;
    ticketDoc.image(qrBuffer, (220 - qrW) / 2, y, { width: qrW });
    y += qrW + 10;

    ticketDoc.font('Helvetica').fontSize(9)
      .text('¡Gracias por tu compra!', 0, y, { width: 220, align: 'center' });
    y += 12;
    ticketDoc.fontSize(8)
      .text('Solo válido para fines informativos', 0, y, { width: 220, align: 'center' });

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
  generarTicketPDF,
};
