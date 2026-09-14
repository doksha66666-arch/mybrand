// حماية إضافية ضد NoSQL injection: بتشيل أي مفتاح في الـ body/query/params
// بيبدأ بـ "$" أو فيه نقطة "." (زي {"$gt": ""} أو {"a.b": 1})
// من غير ما نضيف أي مكتبة جديدة - عشان نتجنب أي مخاطرة تثبيت في بيئة النشر.

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }
  return value;
}

module.exports = function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  if (req.query && typeof req.query === 'object') {
    const cleanedQuery = sanitizeValue(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, cleanedQuery);
  }
  if (req.params && typeof req.params === 'object') req.params = sanitizeValue(req.params);
  next();
};
