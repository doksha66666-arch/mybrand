// Order details may contain customer contact and delivery information.
// Customers and admins keep their existing access; merchant accounts must be approved.
module.exports = (req, res, next) => {
  if (req.user?.role === 'merchant' && req.merchant?.status !== 'approved') {
    return res.status(403).json({ message: 'الوصول إلى بيانات الطلبات متاح للتجار المعتمدين فقط' });
  }
  next();
};
