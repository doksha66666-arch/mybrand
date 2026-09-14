// Storefront login is intentionally email-only. Phone remains a profile/contact field.
module.exports = (req, res, next) => {
  const email = String(req.body?.email || '').trim();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'تسجيل الدخول متاح بالبريد الإلكتروني فقط' });
  }
  next();
};
