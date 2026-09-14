const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

// Enforce the coupon's per-user limit server-side before an order reserves it.
// Cancelled orders do not consume the user's coupon allowance.
module.exports = async (req, res, next) => {
  try {
    const rawCode = req.body?.couponCode;
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code || !req.user?._id) return next();

    const coupon = await Coupon.findOne({ code });
    // The order controller remains the source of truth for invalid/missing coupons.
    if (!coupon || !coupon.perUserLimit) return next();

    const usedByUser = await Order.countDocuments({
      user: req.user._id,
      couponCode: code,
      status: { $ne: 'cancelled' },
    });

    if (usedByUser >= coupon.perUserLimit) {
      return res.status(409).json({
        message: 'لقد وصلت إلى الحد الأقصى لاستخدام هذه القسيمة على حسابك',
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
