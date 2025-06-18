const nodemailer = require('nodemailer');
const twilio = require('twilio');
const db = require('../db');
const { ESTADOS_PEDIDO } = require('../utils/constants');

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
      console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
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
  
    if (!pedido.telefono?.startsWith('+')) {
      console.warn('⚠️ Número de teléfono no válido para WhatsApp:', pedido.telefono);
      return;
    }
  
    // ✅ Enviar WhatsApp
    try {
      const message = await client.messages.create({
        from: fromWhatsAppNumber,
        to: `whatsapp:${pedido.telefono}`,
        contentSid: 'HX78a37ca3b3e9c498f462e6645e86ebe5', // plantilla: pago_confirmado
        contentVariables: JSON.stringify({
          '1': String(nombre),
          '2': String(numero),
        }),
      });
  
      console.log('✅ WhatsApp de confirmación de pago enviado:', message.sid);
    } catch (error) {
      console.error('❌ Error al enviar WhatsApp de confirmación de pago:', error.message);
    }
  
    // ✅ Actualizar estado en la base de datos
    try {
      await db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [ESTADOS_PEDIDO.PAGO_CONFIRMADO, numero]);
      console.log('📦 Estado del pedido actualizado a "pago confirmado"');
    } catch (error) {
      console.error('❌ Error al actualizar el estado del pedido:', error.message);
    }
  }
  
 // Función de notificación (correo + WhatsApp) de Listo para Entrega
async function enviarNotificacionListoParaEntrega(pedido) {
    const email = pedido.correo_cliente;
    const nombre = pedido.nombre_cliente;
    const numero = pedido.numero_pedido;
  
    if (!email || !nombre || !numero) {
      console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
      return;
    }
  
    // ✅ Enviar correo de confirmación
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '✅ Listo para Entrega - KokoShop',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu pedido <strong>#${numero}</strong> esta listo para su entrega.</p>
        <p>Muy pronto prepararemos tu pedido para su envío.</p>
        <br>
        <p>Gracias por confiar en KokoShop 🐼💖</p>
      `,
    });
  
    if (!pedido.telefono?.startsWith('+')) {
      console.warn('⚠️ Número de teléfono no válido para WhatsApp:', pedido.telefono);
      return;
    }
  
    // ✅ Enviar WhatsApp
    try {
      const message = await client.messages.create({
        from: fromWhatsAppNumber,
        to: `whatsapp:${pedido.telefono}`,
        contentSid: 'HX93829977fd17342545b9d5252bfee0b5', // plantilla: listo_para_entrega
        contentVariables: JSON.stringify({
          '1': String(nombre),
          '2': String(numero),
        }),
      });
  
      console.log('✅ WhatsApp de confirmación de pedido listo para su entrega:', message.sid);
    } catch (error) {
      console.error('❌ Error al enviar WhatsApp de confirmación de listo para su entrega:', error.message);
    }
  
    // ✅ Actualizar estado en la base de datos
    try {
      await db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [ESTADOS_PEDIDO.LISTO_ENTREGA, numero]);
      console.log('📦 Estado del pedido actualizado a "listo para entrega"');
    } catch (error) {
      console.error('❌ Error al actualizar el estado del pedido:', error.message);
    }
  }

// Función de notificación (correo + WhatsApp) de Listo para Envio
async function enviarNotificacionPedidoEnviado(pedido) {
    const email = pedido.correo_cliente;
    const nombre = pedido.nombre_cliente;
    const numero = pedido.numero_pedido;
  
    if (!email || !nombre || !numero) {
      console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
      return;
    }
  
    // ✅ Enviar correo de confirmación
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '✅ Pedido Enviado - KokoShop',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu pedido <strong>#${numero}</strong> ha sido enviado.</p>
        <p>Muy pronto te notificaremos o te llamaremos cuando tu pedido esté en el punto de entrega o recojo.</p>
        <br>
        <p>Gracias por confiar en KokoShop 🐼💖</p>
      `,
    });
  
    if (!pedido.telefono?.startsWith('+')) {
      console.warn('⚠️ Número de teléfono no válido para WhatsApp:', pedido.telefono);
      return;
    }
  
    // ✅ Enviar WhatsApp
    try {
      const message = await client.messages.create({
        from: fromWhatsAppNumber,
        to: `whatsapp:${pedido.telefono}`,
        contentSid: 'HX4dba10226f529c87b1e79f636f4a3990', // plantilla: pedido_enviado
        contentVariables: JSON.stringify({
          '1': String(nombre),
          '2': String(numero),
        }),
      });
  
      console.log('✅ WhatsApp de confirmación de pedido enviado:', message.sid);
    } catch (error) {
      console.error('❌ Error al enviar WhatsApp de confirmacion de pedido enviado:', error.message);
    }
  
    // ✅ Actualizar estado en la base de datos
    try {
      await db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [ESTADOS_PEDIDO.ENVIADO, numero]);
      console.log('📦 Estado del pedido actualizado a "pedido enviado"');
    } catch (error) {
      console.error('❌ Error al actualizar el estado del pedido:', error.message);
    }
  }

// Función de notificación (correo + WhatsApp) de Pedido Entregado
async function enviarNotificacionPedidoEntregado(pedido) {
    const email = pedido.correo_cliente;
    const nombre = pedido.nombre_cliente;
    const numero = pedido.numero_pedido;
  
    if (!email || !nombre || !numero) {
      console.warn('⚠️ No se puede enviar la notificación: información incompleta:', pedido);
      return;
    }
  
    // ✅ Enviar correo de confirmación
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
  
    // ✅ Enviar WhatsApp
    try {
      const message = await client.messages.create({
        from: fromWhatsAppNumber,
        to: `whatsapp:${pedido.telefono}`,
        contentSid: 'HXc726b006ab3c8a833765a3c959abcb6f', // plantilla: pedido_entregado
        contentVariables: JSON.stringify({
          '1': String(nombre),
          '2': String(numero),
        }),
      });
  
      console.log('✅ WhatsApp de confirmación de pedido entregado enviado:', message.sid);
    } catch (error) {
      console.error('❌ Error al enviar WhatsApp de pedido entregado enviado:', error.message);
    }
  
    // ✅ Actualizar estado en la base de datos
    try {
      //await db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', ['pedido entregado', numero]);  
      await db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [ESTADOS_PEDIDO.ENTREGADO, numero]);
      console.log('📦 Estado del pedido actualizado a "pedido entregado"');
    } catch (error) {
      console.error('❌ Error al actualizar el estado del pedido:', error.message);
    }
  }

module.exports = {
  enviarCorreoPedido,
  enviarWhatsappPedidoInicial,
  enviarNotificacionConfirmacionPago,
  enviarNotificacionListoParaEntrega,
  enviarNotificacionPedidoEnviado,
  enviarNotificacionPedidoEntregado,
};
