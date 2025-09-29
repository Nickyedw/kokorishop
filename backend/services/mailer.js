// backend/services/mailer.js
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const {
  SMTP_HOST = 'smtp-relay.brevo.com',   // ✅ Brevo SMTP por defecto
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,                           // "true" | "false"
  EMAIL_FROM_ADDR,                       // remitente visible
  EMAIL_FROM_NAME = 'KokoriShop',
  BREVO_API_KEY,                         // ✅ tu API Key de Brevo
  EMAIL_TRANSPORT,                       // 'brevo_api' para forzar API
} = process.env;

const port = Number(SMTP_PORT) || 587;
const secure =
  String(SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

function buildFrom() {
  const addr = EMAIL_FROM_ADDR || SMTP_USER;
  const name = EMAIL_FROM_NAME || 'KokoriShop';
  return `"${name}" <${addr}>`;
}

// --- Transport SMTP (se queda por compatibilidad/fallback)
const transporter = nodemailer.createTransport({
  pool: true,
  host: SMTP_HOST,
  port,
  secure,                      // false en 587 (STARTTLS), true en 465
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  family: 4,                   // fuerza IPv4
  connectionTimeout: 25000,
  greetingTimeout: 12000,
  socketTimeout: 25000,
  dnsTimeout: 8000,
  requireTLS: !secure,
  tls: { servername: SMTP_HOST, rejectUnauthorized: true },
});

async function verifyMailer() {
  console.log('🔎 Verificando SMTP…', { host: SMTP_HOST, port, secure });
  try {
    await transporter.verify();
    console.log('✅ SMTP listo (Brevo): OK');
  } catch (e) {
    console.error('❌ SMTP verify falló:', e.code || e.name, e.message);
  }
}

const emailDefaults = { from: buildFrom() };

// --- Envío vía SMTP (se usará solo si está disponible)
async function sendViaSMTP({ to, subject, html, text, attachments }) {
  return transporter.sendMail({
    ...emailDefaults,
    to,
    subject,
    html,
    text,
    attachments, // [{ filename, path }] o { content }
  });
}

// --- Envío vía API HTTP de Brevo (puerto 443, evita bloqueos SMTP)
async function sendViaBrevoAPI({ to, subject, html, text, attachments }) {
  if (!BREVO_API_KEY) throw new Error('Falta BREVO_API_KEY');

  const toList = Array.isArray(to) ? to : [to];
  const payload = {
    sender: { email: EMAIL_FROM_ADDR || SMTP_USER, name: EMAIL_FROM_NAME },
    to: toList.map((email) => ({ email })),
    subject,
    htmlContent: html,
    textContent: text,
  };

  if (attachments?.length) {
    payload.attachment = attachments
      .map((att) => {
        if (att.path) {
          const content = fs.readFileSync(att.path).toString('base64');
          return { name: att.filename || path.basename(att.path), content };
        }
        if (att.content) {
          const buf = Buffer.isBuffer(att.content) ? att.content : Buffer.from(String(att.content));
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

// --- Facade: elige API o SMTP automáticamente
async function sendMail(options) {
  const prefer = (EMAIL_TRANSPORT || '').toLowerCase();
  if (prefer === 'brevo_api') {
    return sendViaBrevoAPI(options); // fuerza API
  }

  // intenta SMTP; si Render lo bloquea (ETIMEDOUT), usa API
  try {
    await transporter.verify();
    return sendViaSMTP(options);
  } catch (e) {
    console.warn('SMTP no disponible, usando Brevo API:', e.message);
    return sendViaBrevoAPI(options);
  }
}

module.exports = { transporter, buildFrom, emailDefaults, verifyMailer, sendMail };
