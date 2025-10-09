// backend/services/notificaciones.js
const fs = require('fs');
const { sendMail } = require('./mailer');
const twilio = require('twilio');

const {
  generarComprobantePDF,
  generarTicketPDF,
} = require('../controllers/comprobante');

/* =========================
   Helpers comunes
   ========================= */
const toText = (html = '') =>
  String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+\n/g, '\n')
    .trim();

async function sendMailSafe(options, label = 'correo') {
  try {
    if (!options?.to) {
      console.warn(`⚠️ ${label} omitido: falta 'to'`);
      return false;
    }
    const payload = {
      ...options,
      // Fallback de texto sencillo
      text: options.text || toText(options.html || ''),
    };
    await sendMail(payload);
    return true;
  } catch (e) {
    console.error(`❌ Error al enviar ${label}:`, e.message);
    return false;
  }
}

function hasPlusPhone(n) {
  return typeof n === 'string' && n.trim().startsWith('+');
}

/* =========================
   Twilio WhatsApp (opcional)
   ========================= */
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const FROM_WA = process.env.TWILIO_WA_FROM || 'whatsapp:+14155238886'; // sandbox

const WA_ENABLED = Boolean(TWILIO_SID && TWILIO_TOKEN);
const waClient = WA_ENABLED ? twilio(TWILIO_SID, TWILIO_TOKEN) : null;

async function waSend(opts, label = 'WhatsApp') {
  if (!WA_ENABLED) {
    console.warn(`ℹ️ ${label} omitido: Twilio no configurado.`);
    return false;
  }
  try {
    const msg = await waClient.messages.create(opts);
    console.log(`✅ ${label} enviado:`, msg.sid);
    return true;
  } catch (e) {
    console.error(`❌ Error al enviar ${label}:`, e.message);
    return false;
  }
}

/* =========================
   Correo: Alerta de stock bajo
   ========================= */
async function enviarAlertaStockBajo(nombreProducto, stock_actual, stock_minimo) {
  const emailDestino =
    process.env.EMAIL_STOCK_ALERT ||
    process.env.EMAIL_FROM_ADDR ||
    process.env.SMTP_USER;

  const asunto = `⚠️ Stock Bajo: ${nombreProducto}`;
  const html = `
    <h2>Alerta de Stock</h2>
    <p>El producto <strong>${nombreProducto}</strong> tiene un stock actual de
    <strong>${stock_actual}</strong>, por debajo del mínimo (<strong>${stock_minimo}</strong>).</p>
    <p>Se recomienda reponer el stock lo antes posible.</p>
  `;

  return sendMailSafe(
    { to: emailDestino, subject: asunto, html },
    'alerta de stock bajo'
  );
}

/* =========================
   Correo: Pedido creado
   ========================= */
async function enviarCorreoPedido(destinatario, nombreCliente, pedidoId) {
  return sendMailSafe(
    {
      to: destinatario,
      subject: `🛒 Pedido recibido #${pedidoId} – KokoriShop`,
      html: `
        <h2>Hola ${nombreCliente || ''}!</h2>
        <p>Tu pedido <strong>#${pedidoId}</strong> fue registrado correctamente.</p>
        <p>Te avisaremos cuando confirmemos el pago 💜</p>
        <p>Gracias por comprar en <strong>KokoriShop</strong>.</p>
      `,
    },
    'correo de pedido'
  );
}

/* =========================
   WhatsApp: Pedido creado
   ========================= */
async function enviarWhatsappPedidoInicial(numeroCliente, nombreCliente, pedidoId, fecha, total) {
  if (!hasPlusPhone(numeroCliente)) {
    console.warn('⚠️ WhatsApp inicial omitido: número inválido', numeroCliente);
    return false;
  }

  return waSend(
    {
      from: FROM_WA,
      to: `whatsapp:${numeroCliente}`,
      contentSid:
        process.env.TWILIO_CONTENT_SID_PEDIDO ||
        'HXa593da9b7b9af6744360afeb03d0995d',
      contentVariables: JSON.stringify({
        '1': String(nombreCliente || ''),
        '2': String(pedidoId || ''),
        '3': String(fecha || ''),
        '4': String(Number(total || 0).toFixed(2)),
      }),
    },
    'WhatsApp inicial'
  );
}

/* =========================
   Correo + WA: Pago confirmado
   ========================= */
async function enviarNotificacionConfirmacionPago(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ Notificación pago: datos incompletos', { email, nombre, numero });
    return false;
  }

  let pdfPath;
  try {
    pdfPath = await generarComprobantePDF(numero);
  } catch (e) {
    console.error('❌ Error generando comprobante PDF:', e.message);
  }
  const attachments =
    pdfPath && fs.existsSync(pdfPath)
      ? [{ filename: `comprobante_${numero}.pdf`, path: pdfPath }]
      : undefined;

  await sendMailSafe(
    {
      to: email,
      subject: '✅ Pago confirmado – KokoriShop',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu pago para el pedido <strong>#${numero}</strong> ha sido <b>confirmado</b>.</p>
        <p>Muy pronto prepararemos tu pedido para su entrega.</p>
        <p>Gracias por confiar en KokoriShop 🐼💖</p>
      `,
      attachments,
    },
    'confirmación de pago'
  );

  if (!hasPlusPhone(pedido.telefono)) {
    console.warn('⚠️ WhatsApp pago: número inválido', pedido.telefono);
    return false;
  }

  return waSend(
    {
      from: FROM_WA,
      to: `whatsapp:${pedido.telefono}`,
      contentSid:
        process.env.TWILIO_CONTENT_SID_PAGO ||
        'HX78a37ca3b3e9c498f462e6645e86ebe5',
      contentVariables: JSON.stringify({
        '1': String(nombre || ''),
        '2': String(numero || ''),
      }),
    },
    'WhatsApp confirmación de pago'
  );
}

/* =========================
   Correo + WA: Listo para entrega
   ========================= */
async function enviarNotificacionListoParaEntrega(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ Notificación listo para entrega: datos incompletos', { email, nombre, numero });
    return false;
  }

  await sendMailSafe(
    {
      to: email,
      subject: '📦 Listo para entrega – KokoriShop',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu pedido <strong>#${numero}</strong> está <b>listo para su entrega</b>.</p>
        <p>Te avisaremos con los detalles de envío o recojo.</p>
        <p>Gracias por confiar en KokoriShop 🐼💖</p>
      `,
    },
    'listo para entrega'
  );

  if (!hasPlusPhone(pedido.telefono)) {
    console.warn('⚠️ WhatsApp listo para entrega: número inválido', pedido.telefono);
    return false;
  }

  return waSend(
    {
      from: FROM_WA,
      to: `whatsapp:${pedido.telefono}`,
      contentSid:
        process.env.TWILIO_CONTENT_SID_LISTO ||
        'HX93829977fd17342545b9d5252bfee0b5',
      contentVariables: JSON.stringify({
        '1': String(nombre || ''),
        '2': String(numero || ''),
      }),
    },
    'WhatsApp listo para entrega'
  );
}

/* =========================
   Correo + WA: Pedido enviado
   ========================= */
async function enviarNotificacionPedidoEnviado(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ Notificación envío: datos incompletos', { email, nombre, numero });
    return false;
  }

  let pdfPath;
  try {
    pdfPath = await generarTicketPDF(numero);
  } catch (e) {
    console.error('❌ Error generando ticket PDF:', e.message);
  }
  const attachments =
    pdfPath && fs.existsSync(pdfPath)
      ? [{ filename: `ticket_${numero}.pdf`, path: pdfPath }]
      : undefined;

  await sendMailSafe(
    {
      to: email,
      subject: '🚚 Pedido enviado – KokoriShop',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu pedido <strong>#${numero}</strong> ha sido <b>enviado</b>.</p>
        <p>Te notificaremos cuando llegue al punto de entrega.</p>
        <p>Gracias por confiar en KokoriShop 🐼💖</p>
      `,
      attachments,
    },
    'pedido enviado'
  );

  if (!hasPlusPhone(pedido.telefono)) {
    console.warn('⚠️ WhatsApp enviado: número inválido', pedido.telefono);
    return false;
  }

  return waSend(
    {
      from: FROM_WA,
      to: `whatsapp:${pedido.telefono}`,
      contentSid:
        process.env.TWILIO_CONTENT_SID_ENVIADO ||
        'HX4dba10226f529c87b1e79f636f4a3990',
      contentVariables: JSON.stringify({
        '1': String(nombre || ''),
        '2': String(numero || ''),
      }),
    },
    'WhatsApp pedido enviado'
  );
}

/* =========================
   Correo + WA: Pedido entregado
   ========================= */
async function enviarNotificacionPedidoEntregado(pedido) {
  const email = pedido.correo_cliente;
  const nombre = pedido.nombre_cliente;
  const numero = pedido.numero_pedido;

  if (!email || !nombre || !numero) {
    console.warn('⚠️ Notificación entregado: datos incompletos', { email, nombre, numero });
    return false;
  }

  await sendMailSafe(
    {
      to: email,
      subject: '✅ Pedido entregado – KokoriShop',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu pedido <strong>#${numero}</strong> ha sido <b>entregado</b> con éxito.</p>
        <p>¡Gracias por tu compra! Te esperamos pronto 🐼💖</p>
      `,
    },
    'pedido entregado'
  );

  if (!hasPlusPhone(pedido.telefono)) {
    console.warn('⚠️ WhatsApp entregado: número inválido', pedido.telefono);
    return false;
  }

  return waSend(
    {
      from: FROM_WA,
      to: `whatsapp:${pedido.telefono}`,
      contentSid:
        process.env.TWILIO_CONTENT_SID_ENTREGADO ||
        'HXc726b006ab3c8a833765a3c959abcb6f',
      contentVariables: JSON.stringify({
        '1': String(nombre || ''),
        '2': String(numero || ''),
      }),
    },
    'WhatsApp pedido entregado'
  );
}

// === Admin summary ===
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.CORREO_ADMIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const TIENDA_NOMBRE = process.env.TIENDA_NOMBRE || 'Tienda';

const $$fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

async function enviarCorreoAdminNuevoPedido(resumen) {
  // Si no hay admins configurados, salimos silenciosamente
  if (!ADMIN_EMAILS.length) return;

  const {
    pedido_id,
    fecha,
    total,
    usuario = {},
    items = [],
    metodo_pago,
    metodo_entrega,
    zona,
    horario,
  } = resumen;

  const filas = items.map((it, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${it.nombre || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee; text-align:right;">${it.cantidad}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee; text-align:right;">${$$fmt(it.precio_unitario)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee; text-align:right;">${$$fmt(it.cantidad * it.precio_unitario)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#111; line-height:1.6;">
      <h2 style="margin:0 0 10px">${TIENDA_NOMBRE} – Nuevo pedido #${pedido_id}</h2>
      <p style="margin:0 0 12px;">Fecha: <strong>${fecha}</strong></p>
      <p style="margin:0 0 12px;">
        Cliente: <strong>${usuario.nombre_completo || ''}</strong><br/>
        Email: <a href="mailto:${usuario.correo}">${usuario.correo || '-'}</a><br/>
        Tel: ${usuario.telefono || '-'}
      </p>

      <p style="margin:0 0 12px;">
        Método de pago: <strong>${metodo_pago || '-'}</strong><br/>
        Método de entrega: <strong>${metodo_entrega || '-'}</strong><br/>
        Zona: <strong>${zona || '-'}</strong><br/>
        Horario: <strong>${horario || '-'}</strong>
      </p>

      <table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px;">
        <thead>
          <tr style="background:#fafafa">
            <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #eee;">#</th>
            <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #eee;">Producto</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #eee;">Cant.</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #eee;">P. Unit</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #eee;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${filas || '<tr><td colspan="5" style="padding:10px;color:#666;">Sin ítems</td></tr>'}</tbody>
      </table>

      <p style="margin:16px 0 6px; font-size:16px;">
        Total: <strong>${$$fmt(total)}</strong>
      </p>
    </div>
  `;

await sendMailSafe(
  {
    to: ADMIN_EMAILS, // puede ser array o string con comas
    subject: `[${TIENDA_NOMBRE}] Nuevo pedido #${pedido_id} – ${$$fmt(total)}`,
    html,
  },
  'resumen admin de pedido'
);
}

module.exports = {
  enviarCorreoPedido,
  enviarWhatsappPedidoInicial,
  enviarNotificacionConfirmacionPago,
  enviarNotificacionListoParaEntrega,
  enviarNotificacionPedidoEnviado,
  enviarNotificacionPedidoEntregado,
  enviarAlertaStockBajo,
  enviarCorreoAdminNuevoPedido,
};
