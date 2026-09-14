const crypto = require('crypto');
const User = require('../models/User');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');

const roundPoints = (value) => Math.max(0, Math.floor(Number(value || 0)));
const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

async function getConfig() {
  let config = await LoyaltyConfig.findOne({ key: 'global' });
  if (!config) config = await LoyaltyConfig.create({ key: 'global' });
  return config;
}

function publicConfig(config) {
  return {
    enabled: Boolean(config.enabled),
    pointsPer100: Number(config.pointsPer100 || 0),
    pointValue: Number(config.pointValue || 0),
    minimumRedeemPoints: Number(config.minimumRedeemPoints || 1),
    maxRedeemPercent: Number(config.maxRedeemPercent || 0),
    earnOnDelivered: Boolean(config.earnOnDelivered),
  };
}

async function getWallet(userId, limit = 20) {
  const [user, config, transactions] = await Promise.all([
    User.findById(userId).select('points name email phone').lean(),
    getConfig(),
    LoyaltyTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).populate('order', 'orderNumber').lean(),
  ]);
  if (!user) throw Object.assign(new Error('الحساب غير موجود'), { statusCode: 404 });
  return { points: Number(user.points || 0), config: publicConfig(config), transactions };
}

function maxRedeemablePoints({ balance, merchandiseAmount, config }) {
  const amount = Math.max(0, Number(merchandiseAmount || 0));
  const percent = Math.min(100, Math.max(0, Number(config.maxRedeemPercent || 0)));
  const value = Number(config.pointValue || 0);
  if (!balance || !value || !percent) return 0;
  const maxDiscount = roundMoney(amount * percent / 100);
  return Math.min(roundPoints(balance), roundPoints(maxDiscount / value));
}

async function reserveRedemption({ userId, requestedPoints, merchandiseAmount }) {
  const config = await getConfig();
  if (!config.enabled) {
    if (Number(requestedPoints || 0) > 0) throw Object.assign(new Error('برنامج نقاط الولاء غير مفعّل حاليًا'), { statusCode: 409 });
    return { points: 0, discount: 0, reservationId: null, balance: 0 };
  }

  const points = roundPoints(requestedPoints);
  const balanceBeforeUser = await User.findById(userId).select('points');
  if (!balanceBeforeUser) throw Object.assign(new Error('الحساب غير موجود'), { statusCode: 404 });
  const balance = Number(balanceBeforeUser.points || 0);
  if (!points) return { points: 0, discount: 0, reservationId: null, balance };
  if (points < Number(config.minimumRedeemPoints || 1)) {
    throw Object.assign(new Error(`الحد الأدنى للاستبدال هو ${config.minimumRedeemPoints} نقطة`), { statusCode: 400 });
  }

  const maxPoints = maxRedeemablePoints({ balance, merchandiseAmount, config });
  if (points > maxPoints) {
    throw Object.assign(new Error(`يمكنك استبدال ${maxPoints} نقطة كحد أقصى لهذا الطلب`), { statusCode: 400 });
  }

  const updated = await User.findOneAndUpdate(
    { _id: userId, points: { $gte: points } },
    { $inc: { points: -points } },
    { new: true }
  ).select('points');
  if (!updated) throw Object.assign(new Error('رصيد النقاط تغيّر، يرجى المحاولة مرة أخرى'), { statusCode: 409 });

  const reservationId = crypto.randomUUID();
  const delta = -points;
  const discount = roundMoney(points * Number(config.pointValue));
  try {
    await LoyaltyTransaction.create({
      user: userId,
      type: 'redeem',
      delta,
      balanceAfter: Number(updated.points || 0),
      reason: 'حجز نقاط لاستخدامها في طلب جديد',
      status: 'reserved',
      reservationId,
      metadata: { pointValue: Number(config.pointValue), merchandiseAmount: roundMoney(merchandiseAmount) },
    });
  } catch (error) {
    await User.updateOne({ _id: userId }, { $inc: { points } });
    throw error;
  }

  return { points, discount, reservationId, balance: Number(updated.points || 0) };
}

async function finalizeRedemption(reservationId, orderId) {
  if (!reservationId || !orderId) return;
  await LoyaltyTransaction.updateOne(
    { reservationId, status: 'reserved' },
    { $set: { status: 'completed', order: orderId, reason: 'استبدال نقاط في طلب' } }
  );
}

async function releaseRedemption(reservationId, reason = 'إلغاء استبدال النقاط') {
  if (!reservationId) return 0;
  const tx = await LoyaltyTransaction.findOneAndUpdate(
    { reservationId, status: 'reserved' },
    { $set: { status: 'reversed', reason } },
    { new: true }
  );
  if (!tx) return 0;
  const points = Math.abs(Number(tx.delta || 0));
  if (!points) return 0;
  const user = await User.findByIdAndUpdate(tx.user, { $inc: { points } }, { new: true }).select('points');
  if (!user) return 0;
  tx.balanceAfter = Number(user.points || 0);
  await tx.save();
  return points;
}

async function releaseCompletedRedemptionForOrder(orderId, reason = 'إعادة النقاط بسبب إلغاء الطلب') {
  if (!orderId) return 0;
  const tx = await LoyaltyTransaction.findOneAndUpdate(
    { order: orderId, type: 'redeem', status: 'completed' },
    { $set: { status: 'reversed', reason } },
    { new: true }
  );
  if (!tx) return 0;
  const points = Math.abs(Number(tx.delta || 0));
  if (!points) return 0;
  const user = await User.findByIdAndUpdate(tx.user, { $inc: { points } }, { new: true }).select('points');
  if (!user) return 0;
  tx.balanceAfter = Number(user.points || 0);
  await tx.save();
  return points;
}

async function awardDeliveredOrder(order) {
  const config = await getConfig();
  if (!config.enabled || !config.earnOnDelivered || !order?.user) return 0;
  const eligibleAmount = Math.max(0, Number(order.subtotal || 0) - Number(order.discount || 0) - Number(order.loyaltyDiscount || 0));
  const points = roundPoints((eligibleAmount / 100) * Number(config.pointsPer100 || 0));
  if (!points) return 0;
  const dedupeKey = `earn:${String(order._id)}`;

  let transaction;
  try {
    transaction = await LoyaltyTransaction.create({
      user: order.user,
      order: order._id,
      type: 'earn',
      delta: points,
      balanceAfter: 0,
      reason: 'نقاط مكتسبة من طلب مكتمل',
      status: 'reserved',
      dedupeKey,
      metadata: { eligibleAmount: roundMoney(eligibleAmount), pointsPer100: Number(config.pointsPer100 || 0) },
    });
  } catch (error) {
    if (error?.code === 11000) return 0;
    throw error;
  }

  const user = await User.findByIdAndUpdate(order.user, { $inc: { points } }, { new: true }).select('points');
  if (!user) {
    await LoyaltyTransaction.deleteOne({ _id: transaction._id, status: 'reserved' });
    return 0;
  }
  transaction.balanceAfter = Number(user.points || 0);
  transaction.status = 'completed';
  await transaction.save();
  return points;
}

async function adjustPoints({ userId, delta, reason }) {
  const change = Number(delta || 0);
  if (!Number.isInteger(change) || change === 0) throw Object.assign(new Error('قيمة تعديل النقاط غير صالحة'), { statusCode: 400 });
  const query = change > 0 ? { _id: userId } : { _id: userId, points: { $gte: Math.abs(change) } };
  const user = await User.findOneAndUpdate(query, { $inc: { points: change } }, { new: true }).select('points name email phone');
  if (!user) throw Object.assign(new Error(change < 0 ? 'رصيد النقاط غير كافٍ' : 'العميل غير موجود'), { statusCode: change < 0 ? 409 : 404 });
  await LoyaltyTransaction.create({
    user: userId,
    type: 'adjust',
    delta: change,
    balanceAfter: Number(user.points || 0),
    reason: String(reason || 'تعديل يدوي من لوحة التحكم').trim(),
    status: 'completed',
  });
  return user;
}

module.exports = {
  getConfig,
  publicConfig,
  getWallet,
  maxRedeemablePoints,
  reserveRedemption,
  finalizeRedemption,
  releaseRedemption,
  releaseCompletedRedemptionForOrder,
  awardDeliveredOrder,
  adjustPoints,
};
