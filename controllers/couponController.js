const Coupon = require('../models/Coupon');
const User = require('../models/User');

const COUPON_FIELDS = ['code', 'titleAr', 'descriptionAr', 'discountType', 'discountValue', 'minOrderAmount', 'maxDiscountAmount', 'usageLimit', 'perUserLimit', 'startDate', 'endDate', 'isActive', 'assignedTo', 'rewardOnly'];

function pickAllowed(source = {}) {
  return COUPON_FIELDS.reduce((out, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
    return out;
  }, {});
}

function normalize(data) {
  const out = { ...data };
  if (out.code !== undefined) out.code = String(out.code).trim().toUpperCase();
  return out;
}

function couponStatus(coupon) {
  const now = new Date();
  if (!coupon || !coupon.isActive) return 'inactive';
  if (!(coupon.startDate instanceof Date) || Number.isNaN(coupon.startDate.getTime())) return 'invalid';
  if (!(coupon.endDate instanceof Date) || Number.isNaN(coupon.endDate.getTime())) return 'invalid';
  if (coupon.startDate > now) return 'not_started';
  if (coupon.endDate < now) return 'expired';
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return 'limit_reached';
  return 'active';
}

function usable(coupon) { return couponStatus(coupon) === 'active'; }

function calculateDiscount(coupon, amount) {
  if (amount < coupon.minOrderAmount) return 0;
  let discount = coupon.discountType === 'percentage' ? amount * coupon.discountValue / 100 : coupon.discountValue;
  if (coupon.maxDiscountAmount != null) discount = Math.min(discount, coupon.maxDiscountAmount);
  return Math.min(Math.max(0, discount), amount);
}

function statusMessage(status) {
  if (status === 'expired') return 'انتهت صلاحية القسيمة';
  if (status === 'not_started') return 'القسيمة لم تبدأ بعد';
  if (status === 'limit_reached') return 'تم الوصول إلى حد استخدام القسيمة';
  if (status === 'inactive') return 'القسيمة غير مفعلة';
  return 'القسيمة غير صالحة';
}

exports.listForCustomer = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ isActive: true, $or: [{ assignedTo: req.user._id }, { assignedTo: { $size: 0 } }] }).sort({ endDate: 1 });
    res.json({ coupons: coupons.filter(usable) });
  } catch (e) { next(e); }
};

exports.validate = async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const amount = Number(req.body.orderAmount || 0);
    if (!code) return res.status(400).json({ message: 'أدخل رمز القسيمة' });
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ message: 'قيمة الطلب غير صالحة' });
    const coupon = await Coupon.findOne({ code });
    const status = couponStatus(coupon);
    if (status !== 'active') return res.status(400).json({ message: statusMessage(status) });
    if (coupon.assignedTo.length && !coupon.assignedTo.some(id => String(id) === String(req.user._id))) return res.status(403).json({ message: 'هذه القسيمة مخصصة لحساب آخر' });
    const discount = calculateDiscount(coupon, amount);
    if (!discount) return res.status(400).json({ message: `الحد الأدنى للطلب ${coupon.minOrderAmount} ج.م` });
    res.json({ valid: true, coupon: { id: coupon._id, code: coupon.code, titleAr: coupon.titleAr, discountType: coupon.discountType, discountValue: coupon.discountValue }, discount });
  } catch (e) { next(e); }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const [coupons, total] = await Promise.all([
      Coupon.find()
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(),
    ]);
    res.json({ coupons, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(normalize(pickAllowed(req.body)));
    res.status(201).json({ coupon });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, normalize(pickAllowed(req.body)), { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'القسيمة غير موجودة' });
    res.json({ coupon });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'القسيمة غير موجودة' });
    res.json({ message: 'تم حذف القسيمة' });
  } catch (e) { next(e); }
};

exports.redeem = async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const coupon = await Coupon.findOne({ code });
    const status = couponStatus(coupon);
    if (status !== 'active') return res.status(400).json({ message: statusMessage(status) });
    if (!coupon.rewardOnly) return res.status(400).json({ message: 'هذه القسيمة تستخدم مباشرة عند الدفع' });
    if (coupon.assignedTo.length && !coupon.assignedTo.some(id => String(id) === String(req.user._id))) return res.status(403).json({ message: 'هذه القسيمة ليست لحسابك' });
    if (!coupon.assignedTo.some(id => String(id) === String(req.user._id))) coupon.assignedTo.push(req.user._id);
    await coupon.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { earnedCoupons: coupon._id } });
    res.json({ message: 'تمت إضافة القسيمة إلى حسابك', coupon });
  } catch (e) { next(e); }
};
