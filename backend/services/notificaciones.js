//backend/services/notificaciones.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const {
  generarComprobantePDF,
  generarTicketPDF
} = require('../controllers/comprobante');

// Configuración de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

// 🟢 Alerta por poco stock (solo correo)
async function enviarAlertaStockBajo(nombreProducto, stock_actual, stock_minimo) {
  const emailDestino = process.env.EMAIL_STOCK_ALERT || process.env.EMAIL_FROM;
  const asunto = `⚠️ Stock Bajo: ${nombreProducto}`;
  const html = `
    <h2>Alerta de Stock</h2>
    <p>El producto <strong>${nombreProducto}</strong> tiene un stock actual de <strong>${stock_actual}</strong>, por debajo del mínimo (<strong>${stock_minimo}</strong>).</p>
    <p>Se recomienda reponer el stock lo antes posible.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: emailDestino,
      subject: asunto,
      html,
    });
    console.log(`📩 Alerta de stock enviada para "${nombreProducto}"`);
  } catch (error) {
    console.error('❌ Error al enviar alerta de stock bajo:', error.message);
  }
}

async function enviarCorreoPedido(destinatario, nombreCliente, pedidoId) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: destinatario,
    subject: `🛒 Pedido confirmado - KokoShop`,
    html: `
      <h2>Hola ${nombreCliente}!</h2>
      <p>Tu pedido con ID <strong>#${pedidoId}</strong> ha sido registrado correctamente.</p>
      <p>Gracias por comprar en <strong>KokoShop</strong> 💖</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Configuración de Twilio WhatsApp
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsAppNumber = 'whatsapp:+14155238886'; // Sandbox Twilio
const client = twilio(accountSid, authToken);

async function enviarWhatsappPedidoInicial(numeroCliente, nombreCliente, pedidoId, fecha, total) {
  try {
    const message = await client.messages.create({
      from: fromWhatsAppNumber,
      to: `whatsapp:${numeroCliente}`,
      contentSid: 'HXa593da9b7b9af6744360afeb03d0995d',
      contentVariables: JSON.stringify({
        '1': String(nombreCliente),
        '2': String(pedidoId),
        '3': String(fecha),
        '4': String(total.toFixed(2))
      }),
    });

    console.log('✅ WhatsApp enviado:', message.sid);
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp:', error.message);
  }
}

async function enviarNotificacionConfirmacionPago(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
    return;
  }

  let pdfPath;
  try {
    pdfPath = await generarComprobantePDF(numero);
  } catch (error) {
    console.error('❌ Error generando comprobante PDF:', error.message);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✅ Pago confirmado - KokoShop',
    html: `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu pago para el pedido <strong>#${numero}</strong> ha sido confirmado con éxito.</p>
      <p>Muy pronto prepararemos tu pedido para su entrega.</p>
      <br>
      <p>Gracias por confiar en KokoShop 🐼💖</p>
    `,
    attachments: [{
      filename: `comprobante_${numero}.pdf`,
      path: pdfPath,
    }],
  });

  if (!pedido.telefono?.startsWith('+')) {
    console.warn('⚠️ Número de teléfono no válido para WhatsApp:', pedido.telefono);
    return;
  }

  try {
    const message = await client.messages.create({
      from: fromWhatsAppNumber,
      to: `whatsapp:${pedido.telefono}`,
      contentSid: 'HX78a37ca3b3e9c498f462e6645e86ebe5',
      contentVariables: JSON.stringify({
        '1': String(nombre),
        '2': String(numero),
      }),
    });

    console.log('✅ WhatsApp de confirmación de pago enviado:', message.sid);
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp de confirmación de pago:', error.message);
  }
}

async function enviarNotificacionListoParaEntrega(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✅ Listo para Entrega - KokoShop',
    html: `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu pedido <strong>#${numero}</strong> está listo para su entrega.</p>
      <p>Muy pronto prepararemos tu pedido para su envío.</p>
      <br>
      <p>Gracias por confiar en KokoShop 🐼💖</p>
    `,
  });

  if (!pedido.telefono?.startsWith('+')) {
    console.warn('⚠️ Número de teléfono no válido para WhatsApp:', pedido.telefono);
    return;
  }

  try {
    const message = await client.messages.create({
      from: fromWhatsAppNumber,
      to: `whatsapp:${pedido.telefono}`,
      contentSid: 'HX93829977fd17342545b9d5252bfee0b5',
      contentVariables: JSON.stringify({
        '1': String(nombre),
        '2': String(numero),
      }),
    });

    console.log('✅ WhatsApp listo para entrega enviado:', message.sid);
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp listo para entrega:', error.message);
  }
}

async function enviarNotificacionPedidoEnviado(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
    return;
  }

  let pdfPath;
  try {
    pdfPath = await generarTicketPDF(numero);
  } catch (error) {
    console.error('❌ Error generando ticket PDF:', error.message);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✅ Pedido Enviado - KokoShop',
    html: `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu pedido <strong>#${numero}</strong> ha sido enviado.</p>
      <p>Muy pronto te notificaremos cuando llegue al punto de entrega.</p>
      <br>
      <p>Gracias por confiar en KokoShop 🐼💖</p>
    `,
    attachments: [{
      filename: `ticket_${numero}.pdf`,
      path: pdfPath,
    }],
  });

  if (!pedido.telefono?.startsWith('+')) {
    console.warn('⚠️ Número de teléfono no válido para WhatsApp:', pedido.telefono);
    return;
  }

  try {
    const message = await client.messages.create({
      from: fromWhatsAppNumber,
      to: `whatsapp:${pedido.telefono}`,
      contentSid: 'HX4dba10226f529c87b1e79f636f4a3990',
      contentVariables: JSON.stringify({
        '1': String(nombre),
        '2': String(numero),
      }),
    });

    console.log('✅ WhatsApp de pedido enviado:', message.sid);
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp de pedido enviado:', error.message);
  }
}

async function enviarNotificacionPedidoEntregado(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✅ Pedido Entregado - KokoShop',
    html: `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu pedido <strong>#${numero}</strong> ha sido entregado con éxito.</p>
      <p>Te esperamos pronto en nuestra tienda online.</p>
      <br>
      <p>Gracias por confiar en KokoShop 🐼💖</p>
    `,
  });

  if (!pedido.telefono?.startsWith('+')) {
    console.warn('⚠️ Número de teléfono no válido para WhatsApp:', pedido.telefono);
    return;
  }

  try {
    const message = await client.messages.create({
      from: fromWhatsAppNumber,
      to: `whatsapp:${pedido.telefono}`,
      contentSid: 'HXc726b006ab3c8a833765a3c959abcb6f',
      contentVariables: JSON.stringify({
        '1': String(nombre),
        '2': String(numero),
      }),
    });

    console.log('✅ WhatsApp de pedido entregado enviado:', message.sid);
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp de pedido entregado:', error.message);
  }
}

module.exports = {
  enviarCorreoPedido,
  enviarWhatsappPedidoInicial,
  enviarNotificacionConfirmacionPago,
  enviarNotificacionListoParaEntrega,
  enviarNotificacionPedidoEnviado,
  enviarNotificacionPedidoEntregado,
  enviarAlertaStockBajo,
};
