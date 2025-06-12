const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Configuración de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

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

// Función de notificación (correo + WhatsApp) de confirmación de pago
async function enviarNotificacionConfirmacionPago(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ No se puede enviar el correo: información incompleta:', pedido);
    return;
  }

  // ✅ Enviar correo de confirmación
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
  });

  // ✅ Enviar WhatsApp con plantilla de Twilio
  try {
    const message = await client.messages.create({
      from: fromWhatsAppNumber,
      to: `whatsapp:${pedido.telefono}`,
      contentSid: 'HX78a37ca3b3e9c498f462e6645e86ebe5', // plantilla: pago_confirmado
      contentVariables: JSON.stringify({
        '1': nombre,
        '2': numero,
      }),
    });

    console.log('✅ WhatsApp de confirmación de pago enviado:', message.sid);
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp de confirmación de pago:', error.message);
  }
}

module.exports = {
  enviarCorreoPedido,
  enviarWhatsappPedidoInicial,
  enviarNotificacionConfirmacionPago,
};
