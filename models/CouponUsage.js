const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  usageNumber: { type: Number, required: true, min: 1 },
  discount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['reserved', 'consumed', 'released'], default: 'consumed' },
}, { timestamps: true });

couponUsageSchema.index({ coupon: 1, user: 1, usageNumber: 1 }, { unique: true });
couponUsageSchema.index({ coupon: 1, user: 1, status: 1 });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
