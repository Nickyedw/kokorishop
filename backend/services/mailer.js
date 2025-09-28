// backend/services/mailer.js
const nodemailer = require('nodemailer');

const {
  SMTP_HOST = 'smtp.gmail.com',
  SMTP_PORT = 465,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM = SMTP_USER,
  EMAIL_FROM_NAME = 'KokoriShop',
} = process.env;

// ⚠️ Gmail -> usa “App password” (no tu password normal).
// En Render: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=tu_correo, SMTP_PASS=app_password
//            EMAIL_FROM=tu_correo, EMAIL_FROM_NAME=KokoriShop
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465, // true para 465 (SSL), false para 587 (STARTTLS)
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// Verificación opcional al arranque o desde /health/email
async function verifyMailer() {
  await transporter.verify();
  console.log('✅ SMTP listo para enviar correos');
}

module.exports = {
  transporter,
  verifyMailer,
  emailDefaults: { from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>` },
};
