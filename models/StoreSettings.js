const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
  key: { type: String, enum: ['global'], unique: true, default: 'global' },
  storeName: { type: String, trim: true, default: 'MYBRAND', maxlength: 120 },
  storeEmail: { type: String, trim: true, default: 'admin@mybrand.com', maxlength: 200 },
  phone: { type: String, trim: true, default: '', maxlength: 40 },
  currency: { type: String, enum: ['EGP', 'USD', 'SAR'], default: 'EGP' },
  timezone: { type: String, enum: ['Africa/Cairo', 'UTC', 'Asia/Riyadh'], default: 'Africa/Cairo' },
  maintenance: { type: Boolean, default: false },
  newOrder: { type: Boolean, default: true },
  lowStock: { type: Boolean, default: true },
  customerMessage: { type: Boolean, default: true },
  pageLayouts: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
