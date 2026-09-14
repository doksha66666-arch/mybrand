const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
  type: { type: String, enum: ['earn', 'redeem', 'adjust', 'reversal'], required: true },
  delta: { type: Number, required: true },
  balanceAfter: { type: Number, required: true, min: 0 },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['reserved', 'completed', 'reversed'], default: 'completed' },
  reservationId: { type: String, default: null, index: true },
  dedupeKey: { type: String, unique: true, sparse: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

loyaltyTransactionSchema.index({ user: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ type: 1, order: 1, user: 1 });

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
