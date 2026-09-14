const crypto = require('crypto');
const nodemailer = require('nodemailer');

const CODE_TTL_MS = 10 * 60 * 1000;

function getMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || user.includes('YOUR_') || pass.includes('YOUR_')) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user, pass },
  });
}

function createVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

async function sendVerificationCode(email, code) {
  const mailer = getMailer();
  if (!mailer) {
    const error = new Error('SMTP verification email service is not configured');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'MYBRAND — كود تأكيد البريد الإلكتروني',
    text: `كود تأكيد بريدك الإلكتروني في MYBRAND هو: ${code}\n\nالكود صالح لمدة 10 دقائق. إذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة.`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>تأكيد البريد الإلكتروني — MYBRAND</h2><p>استخدم الكود التالي لتأكيد بريدك الإلكتروني:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:14px;background:#f5f5f5;border-radius:10px">${code}</div><p>الكود صالح لمدة 10 دقائق.</p><p>إذا لم تطلب إنشاء حساب، يمكنك تجاهل هذه الرسالة.</p></div>`,
  });
}

function verificationExpiry() {
  return new Date(Date.now() + CODE_TTL_MS);
}

module.exports = {
  createVerificationCode,
  hashVerificationCode,
  sendVerificationCode,
  verificationExpiry,
};
