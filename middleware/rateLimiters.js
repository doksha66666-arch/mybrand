const { rateLimit } = require('express-rate-limit');

const commonOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'عدد كبير جدًا من المحاولات. يرجى المحاولة مرة أخرى لاحقًا.' },
};

const authLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

const loginLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

const passwordResetLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

// حماية عامة لكل الـ API من الإغراق بالطلبات (DoS بسيط).
// 600 طلب/15 دقيقة يسمح باستخدام لوحات الإدارة وعمليات LIVE الطبيعية
// مع بقاء سقف واضح ضد الإغراق، خصوصًا لأن بعض صفحات الإنتاج تقوم بالتحديث الدوري.
const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 600,
});

module.exports = { authLimiter, loginLimiter, passwordResetLimiter, apiLimiter };
