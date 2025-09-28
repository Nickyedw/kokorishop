// backend/services/mailer.js
const nodemailer = require('nodemailer');

const {
  SMTP_HOST = 'smtp.gmail.com',
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,                // "true" o "false" (opcional)
  EMAIL_FROM,
  EMAIL_FROM_NAME = 'KokoriShop',
} = process.env;

const port = Number(SMTP_PORT) || 587;
const secure =
  (String(SMTP_SECURE || '').toLowerCase() === 'true') || port === 465;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure,                     // false en 587 (STARTTLS), true en 465
  auth: {
    user: SMTP_USER || EMAIL_FROM,
    pass: SMTP_PASS,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 15000,
  socketTimeout: 15000,
  greetingTimeout: 8000,
  tls: {
    // STARTTLS en 587
    rejectUnauthorized: true,
    servername: SMTP_HOST,
  },
});

async function verifyMailer() {
  try {
    await transporter.verify();
    console.log('✅ SMTP OK');
  } catch (e) {
    console.error('❌ SMTP verify falló:', e.message);
  }
}

const emailDefaults = {
  from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM || SMTP_USER}>`,
};

module.exports = { transporter, emailDefaults, verifyMailer };
