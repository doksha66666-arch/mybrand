const nodemailer = require('nodemailer');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

async function notifyCustomersAboutNewProduct(product) {
  if (!product || product.status === 'pending' || product.status === 'rejected' || product.isActive === false) return;

  const customers = await User.find({ role: 'customer', isActive: true }).select('_id name email preferredLanguage');
  if (!customers.length) return { notified: 0, emailed: 0 };

  const titleAr = 'وصل حديثًا إلى MYBRAND ✨';
  const bodyAr = `منتج جديد وصل الآن: ${product.nameAr}`;
  const link = `/products/${product.slug}`;
  const image = product.images?.[0] || '';

  await Notification.insertMany(customers.map((customer) => ({
    user: customer._id,
    type: 'new_product',
    titleAr,
    bodyAr,
    link,
    image,
  })));

  const transporter = getTransporter();
  let emailed = 0;
  if (transporter) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const siteUrl = process.env.PUBLIC_STORE_URL || 'https://mybrand-app-production-e260.up.railway.app';
    const subject = `وصل حديثًا: ${product.nameAr} ✨`;
    const html = `<!doctype html><html lang="ar" dir="rtl"><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><img src="${image}" alt="" style="width:100%;max-height:360px;object-fit:cover"/><div style="padding:28px"><div style="color:#b08d57;font-weight:700">MYBRAND • وصل حديثًا</div><h1>${product.nameAr}</h1><p>أضفنا منتجًا جديدًا إلى المتجر. اكتشفه الآن قبل أن يفوتك.</p><a href="${siteUrl}${link}" style="display:inline-block;background:#111827;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none">اكتشف المنتج</a></div></div></body></html>`;
    await Promise.allSettled(customers.filter((c) => c.email).map(async (customer) => {
      await transporter.sendMail({ from, to: customer.email, subject, html });
      emailed += 1;
    }));
  }

  return { notified: customers.length, emailed };
}

module.exports = { notifyCustomersAboutNewProduct };
