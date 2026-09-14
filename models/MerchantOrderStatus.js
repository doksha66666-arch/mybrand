const mongoose = require('mongoose');

const merchantOrderStatusSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  status: { type: String, enum: ['confirmed', 'packed', 'ready'], default: 'confirmed' },
}, { timestamps: true });

merchantOrderStatusSchema.index({ order: 1, merchant: 1 }, { unique: true });

module.exports = mongoose.model('MerchantOrderStatus', merchantOrderStatusSchema);
