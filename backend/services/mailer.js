// backend/services/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                       // p.ej. smtp.gmail.com o sandbox smtp de Mailtrap
  port: Number(process.env.SMTP_PORT || 587),        // 465 si usas SSL; 587 STARTTLS
  secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
  auth: (process.env.SMTP_USER && process.env.SMTP_PASS)
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

function buildFrom() {
  const name = process.env.EMAIL_FROM_NAME || 'KokoriShop';
  const addr = process.env.EMAIL_FROM_ADDR || process.env.EMAIL_FROM || process.env.SMTP_USER;
  return `"${name}" <${addr}>`;
}

async function verifyMailer() {
  try {
    await transporter.verify();
    console.log('📬 SMTP OK: conexión verificada');
  } catch (e) {
    console.error('❌ SMTP verify falló:', e.message);
  }
}

module.exports = { transporter, buildFrom, verifyMailer };
