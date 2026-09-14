// معالج أخطاء موحّد - لا يُظهر تفاصيل حساسة للعميل
module.exports = (err, req, res, next) => {
  console.error(err.stack || err.message || err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'حجم الملف أكبر من الحد المسموح' });
    }
    return res.status(400).json({ success: false, message: err.message || 'تعذر معالجة الملف المرفوع' });
  }

  if (err.message?.includes('نوع الملف غير مدعوم') || err.message?.includes('نوع الفيديو غير مدعوم')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'ValidationError') {
    const firstError = Object.values(err.errors)[0];
    return res.status(400).json({ success: false, message: firstError?.message || 'بيانات غير صالحة' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'المعرف المرسل غير صالح' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'القيمة';
    return res.status(409).json({ success: false, message: `${field} مستخدم بالفعل` });
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'حدث خطأ في الخادم، حاول لاحقًا'
      : err.message;

  res.status(statusCode).json({ success: false, message });
};
