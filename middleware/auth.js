const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Merchant = require('../models/Merchant');

// التحقق من تسجيل الدخول
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'المستخدم غير موجود أو غير نشط' });
    }

    req.user = user;

    if (user.role === 'merchant') {
      req.merchant = await Merchant.findOne({ user: user._id });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'جلسة غير صالحة، يرجى تسجيل الدخول مجددًا' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'هذا الإجراء متاح للمشرفين فقط' });
  }
  next();
};

exports.merchantOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'merchant' || !req.merchant) {
    return res.status(403).json({ message: 'هذا الإجراء متاح للتجار فقط' });
  }
  next();
};

exports.approvedMerchantOnly = (req, res, next) => {
  if (!req.merchant || req.merchant.status !== 'approved') {
    return res.status(403).json({
      message:
        req.merchant?.status === 'pending'
          ? 'حسابك كتاجر قيد المراجعة حاليًا، سيتم إعلامك عند الموافقة'
          : 'حسابك كتاجر موقوف حاليًا، تواصل مع الدعم',
    });
  }
  next();
};
