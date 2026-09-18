const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  titleAr: { type: String, default: 'قسيمة خصم' },
  descriptionAr: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscountAmount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1, min: 1 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rewardOnly: { type: Boolean, default: false },
}, { timestamps: true });

couponSchema.pre('validate', function(next) {
  if (this.endDate < this.startDate) return next(new Error('تاريخ انتهاء القسيمة يجب أن يكون بعد تاريخ البداية'));
  if (this.discountType === 'percentage' && this.discountValue > 100) return next(new Error('نسبة الخصم لا يمكن أن تتجاوز 100%'));
  next();
});

couponSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Coupon', couponSchema);
