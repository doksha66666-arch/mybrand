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
// 600 طلب/15 دقيقة يسمح باستخدام لوحات الإدارة وعمليات الإنتاج الطبيعية.
const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  skip: (req) => req.path.startsWith('/live'),
});

// LIVE له معدل مستقل لأن المشاهدة تحتاج heartbeat/polling دوريًا.
// يظل هناك سقف واضح ضد الإغراق دون استهلاك ميزانية الـAPI العامة.
const liveLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 120,
});

module.exports = { authLimiter, loginLimiter, passwordResetLimiter, apiLimiter, liveLimiter };
