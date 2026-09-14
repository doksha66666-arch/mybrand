const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { getConfig, publicConfig, getWallet, maxRedeemablePoints, adjustPoints } = require('../services/loyaltyService');

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await getWallet(req.user._id, 30);
    res.json(wallet);
  } catch (error) { next(error); }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const transactions = await LoyaltyTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit).populate('order', 'orderNumber').lean();
    res.json({ transactions });
  } catch (error) { next(error); }
};

exports.previewRedemption = async (req, res, next) => {
  try {
    const config = await getConfig();
    const user = await User.findById(req.user._id).select('points').lean();
    if (!user) return res.status(404).json({ message: 'الحساب غير موجود' });
    const requestedPoints = Math.max(0, Math.floor(Number(req.body?.points || 0)));
    const merchandiseAmount = Math.max(0, Number(req.body?.merchandiseAmount || 0));
    const maxPoints = config.enabled ? maxRedeemablePoints({ balance: Number(user.points || 0), merchandiseAmount, config }) : 0;
    const acceptedPoints = Math.min(requestedPoints, maxPoints);
    const discount = Math.round(acceptedPoints * Number(config.pointValue || 0) * 100) / 100;
    res.json({ points: Number(user.points || 0), requestedPoints, maxPoints, acceptedPoints, discount, config: publicConfig(config) });
  } catch (error) { next(error); }
};

exports.adminSettings = async (_req, res, next) => {
  try { const config = await getConfig(); res.json({ config: publicConfig(config) }); } catch (error) { next(error); }
};

exports.adminUpdateSettings = async (req, res, next) => {
  try {
    const config = await getConfig();
    const body = req.body || {};
    if (body.enabled !== undefined) config.enabled = Boolean(body.enabled);
    if (body.pointsPer100 !== undefined) config.pointsPer100 = Math.max(0, Number(body.pointsPer100));
    if (body.pointValue !== undefined) config.pointValue = Math.max(0, Number(body.pointValue));
    if (body.minimumRedeemPoints !== undefined) config.minimumRedeemPoints = Math.max(1, Math.floor(Number(body.minimumRedeemPoints)));
    if (body.maxRedeemPercent !== undefined) config.maxRedeemPercent = Math.min(100, Math.max(0, Number(body.maxRedeemPercent)));
    if (body.earnOnDelivered !== undefined) config.earnOnDelivered = Boolean(body.earnOnDelivered);
    if (![config.pointsPer100, config.pointValue, config.minimumRedeemPoints, config.maxRedeemPercent].every(Number.isFinite)) return res.status(400).json({ message: 'يوجد إعداد غير صالح' });
    await config.save();
    res.json({ message: 'تم حفظ إعدادات الولاء', config: publicConfig(config) });
  } catch (error) { next(error); }
};

exports.adminSummary = async (_req, res, next) => {
  try {
    const config = await getConfig();
    const [customerCount, totalPointsAgg, earnedAgg, redeemedAgg] = await Promise.all([
      User.countDocuments({ role: 'customer', isActive: true }),
      User.aggregate([{ $match: { role: 'customer' } }, { $group: { _id: null, total: { $sum: '$points' } } }]),
      LoyaltyTransaction.aggregate([{ $match: { type: 'earn', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$delta' } } }]),
      LoyaltyTransaction.aggregate([{ $match: { type: 'redeem', status: 'completed' } }, { $group: { _id: null, total: { $sum: { $abs: '$delta' } } } }]),
    ]);
    res.json({
      config: publicConfig(config),
      customerCount,
      totalPoints: Number(totalPointsAgg[0]?.total || 0),
      totalEarned: Number(earnedAgg[0]?.total || 0),
      totalRedeemed: Number(redeemedAgg[0]?.total || 0),
    });
  } catch (error) { next(error); }
};

exports.adminCustomers = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = { role: 'customer' };
    if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }];
    const customers = await User.find(filter).select('name email phone points isActive createdAt').sort({ points: -1, createdAt: -1 }).limit(50).lean();
    res.json({ customers });
  } catch (error) { next(error); }
};

exports.adminAdjust = async (req, res, next) => {
  try {
    const user = await adjustPoints({ userId: req.params.userId, delta: Number(req.body?.delta), reason: req.body?.reason });
    res.json({ message: 'تم تعديل النقاط بنجاح', customer: user });
  } catch (error) { next(error); }
};
