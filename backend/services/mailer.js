// backend/services/mailer.js
const nodemailer = require('nodemailer');

const {
  SMTP_HOST = 'smtp-relay.brevo.com',    // ✅ Brevo
  SMTP_PORT = '587',                     // ✅ STARTTLS
  SMTP_USER,                             // ✅ ej: 9810...@smtp-brevo.com
  SMTP_PASS,                             // ✅ clave SMTP (no tu login)
  SMTP_SECURE,                           // "true" | "false"
  EMAIL_FROM_ADDR,                       // remitente visible
  EMAIL_FROM_NAME = 'KokoriShop',
} = process.env;

const port = Number(SMTP_PORT) || 587;
// secure = true solo en 465; en 587 debe ser false (STARTTLS)
const secure =
  String(SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

function buildFrom() {
  // Usa el remitente configurado o, en su defecto, el SMTP_USER
  const addr = EMAIL_FROM_ADDR || SMTP_USER;
  const name = EMAIL_FROM_NAME || 'KokoriShop';
  return `"${name}" <${addr}>`;
}

const transporter = nodemailer.createTransport({
  pool: true,
  host: SMTP_HOST,
  port,
  secure,                      // false en 587, true en 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },

  // ✅ Evita cuelgues/IPv6
  family: 4,                   // fuerza IPv4
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  dnsTimeout: 8000,

  // ✅ STARTTLS correcto en 587
  requireTLS: !secure,
  tls: {
    servername: SMTP_HOST,
    rejectUnauthorized: true,
  },
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

// compatibilidad si en otros módulos usabas emailDefaults
const emailDefaults = { from: buildFrom() };

module.exports = { transporter, buildFrom, emailDefaults, verifyMailer };
