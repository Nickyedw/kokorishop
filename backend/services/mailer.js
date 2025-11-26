// backend/services/mailer.js
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const {
  // 👇 OJO: default cambiado a sendinblue (coincide con el certificado)
  SMTP_HOST = 'smtp-relay.sendinblue.com',
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,                          // "true" | "false"
  EMAIL_FROM_ADDR,                      // remitente visible
  EMAIL_FROM_NAME = 'KokoriShop',
  REPLY_TO_ADDR,                        // opcional
  BREVO_API_KEY,                        // API Key Brevo
  EMAIL_TRANSPORT,                      // 'brevo_api' | 'smtp' | 'auto'
  NODE_ENV = 'production',
} = process.env;

const port = Number(SMTP_PORT) || 587;
const secure =
  String(SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

function buildFrom() {
  const addr = EMAIL_FROM_ADDR || SMTP_USER;
  const name = EMAIL_FROM_NAME || 'KokoriShop';
  return `"${name}" <${addr}>`;
}

// ------- SMTP transporter (fallback/compat) -------
const transporter = nodemailer.createTransport({
  pool: true,
  host: SMTP_HOST,
  port,
  secure,                               // false en 587 (STARTTLS), true en 465
  auth:
    SMTP_USER && SMTP_PASS
      ? { user: SMTP_USER, pass: SMTP_PASS }
      : undefined,

  // timeouts bajos para evitar cuelgues largos
  family: 4,                            // fuerza IPv4
  connectionTimeout: 6000,
  greetingTimeout: 6000,
  socketTimeout: 6000,
  dnsTimeout: 4000,

  requireTLS: !secure,
  tls: {
    servername: SMTP_HOST,
    rejectUnauthorized: true,
  },
});

// Verificación opcional del transporter SMTP
async function verifyMailer() {
  const transport = (EMAIL_TRANSPORT || 'auto').toLowerCase();

  // Si forzamos API, o en producción sin SMTP explícito, NO probamos SMTP
  if (
    transport === 'brevo_api' ||
    (NODE_ENV === 'production' && transport !== 'smtp')
  ) {
    console.log(
      `ℹ️ SMTP verify omitido (EMAIL_TRANSPORT=${transport}, NODE_ENV=${NODE_ENV})`
    );
    return true;
  }

  // Si no hay credenciales SMTP, tampoco tiene sentido probar
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP sin credenciales, se omite verify()');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ SMTP listo:', SMTP_HOST);
    return true;
  } catch (e) {
    console.warn('⚠️ SMTP verify falló:', e.code || e.name, e.message);
    return false;
  }
}

const emailDefaults = {
  from: buildFrom(),
  ...(REPLY_TO_ADDR ? { replyTo: REPLY_TO_ADDR } : {}),
};

// ------- Envío por SMTP -------
async function sendViaSMTP({ to, subject, html, text, attachments, headers }) {
  return transporter.sendMail({
    ...emailDefaults,
    to,
    subject,
    html,
    text,
    attachments, // [{ filename, path }] o { content }
    headers,
  });
}

// ------- Envío por API HTTP de Brevo (puerto 443) -------
async function sendViaBrevoAPI({
  to,
  subject,
  html,
  text,
  attachments,
  headers,
}) {
  if (!BREVO_API_KEY) throw new Error('Falta BREVO_API_KEY');

  const toList = Array.isArray(to) ? to : [to];

  const payload = {
    sender: { email: EMAIL_FROM_ADDR || SMTP_USER, name: EMAIL_FROM_NAME },
    to: toList.map((email) => ({ email })),
    subject,
    htmlContent: html,
    textContent: text,
    headers,
  };

  if (REPLY_TO_ADDR) payload.replyTo = [{ email: REPLY_TO_ADDR }];

  if (attachments?.length) {
    payload.attachment = attachments
      .map((att) => {
        if (att.path) {
          const content = fs.readFileSync(att.path).toString('base64');
          return { name: att.filename || path.basename(att.path), content };
        }
        if (att.content) {
          const buf = Buffer.isBuffer(att.content)
            ? att.content
            : Buffer.from(String(att.content));
          return { name: att.filename || 'adjunto', content: buf.toString('base64') };
        }
        return null;
      })
      .filter(Boolean);
  }

  await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    timeout: 20000,
  });
}

// ------- Facade: decide transporte -------
async function sendMail(options) {
  const prefer = (EMAIL_TRANSPORT || 'auto').toLowerCase();

  // Forzado
  if (prefer === 'brevo_api') return sendViaBrevoAPI(options);
  if (prefer === 'smtp') return sendViaSMTP(options);

  // Auto: en desarrollo intenta SMTP si está vivo, en prod usa API
  if (NODE_ENV === 'development') {
    const ok = await verifyMailer();
    if (ok) return sendViaSMTP(options);
  }
  return sendViaBrevoAPI(options);
}

module.exports = {
  transporter,
  buildFrom,
  emailDefaults,
  verifyMailer,
  sendMail,
};
