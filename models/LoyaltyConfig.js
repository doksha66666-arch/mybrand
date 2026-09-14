const mongoose = require('mongoose');

const loyaltyConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true, index: true },
  enabled: { type: Boolean, default: true },
  pointsPer100: { type: Number, default: 10, min: 0 },
  pointValue: { type: Number, default: 0.1, min: 0 },
  minimumRedeemPoints: { type: Number, default: 10, min: 1 },
  maxRedeemPercent: { type: Number, default: 20, min: 0, max: 100 },
  earnOnDelivered: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyConfig', loyaltyConfigSchema);
