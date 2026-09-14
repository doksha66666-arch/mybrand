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

// حماية عامة لكل الـ API من الإغراق بالطلبات (DoS بسيط) - سقف مرتفع
// عشان ميأثرش على الاستخدام الطبيعي، بس يوقف أي إغراق واضح
const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

module.exports = { authLimiter, loginLimiter, passwordResetLimiter, apiLimiter };
