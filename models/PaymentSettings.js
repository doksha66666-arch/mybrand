const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'global' },
    partialPayment: { type: Boolean, default: false },
    codLimitEnabled: { type: Boolean, default: true },
    showGatewayFees: { type: Boolean, default: true },
    currency: { type: String, default: 'جنيه مصري (EGP)' },
    codLimit: { type: String, default: '3000' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
