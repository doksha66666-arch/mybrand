const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  redeemedAt: { type: Date, default: Date.now },
}, { _id: true });

const giftCardSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  initialBalance: { type: Number, required: true, min: 0 },
  balance: { type: Number, required: true, min: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  redeemedAt: { type: Date, default: null },
  redemptions: [redemptionSchema],
}, { timestamps: true });

giftCardSchema.pre('validate', function(next) {
  if (this.balance > this.initialBalance) return next(new Error('رصيد البطاقة لا يمكن أن يتجاوز قيمتها الأصلية'));
  next();
});

giftCardSchema.index({ assignedTo: 1, isActive: 1 });
giftCardSchema.index({ expiresAt: 1, isActive: 1 });

module.exports = mongoose.model('GiftCard', giftCardSchema);
