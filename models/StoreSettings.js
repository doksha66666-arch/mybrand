const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  accent: { type: String, default: '#0F172A', maxlength: 20 },
  accentSoft: { type: String, default: '#F1F5F9', maxlength: 20 },
  background: { type: String, default: '#F8FAFC', maxlength: 20 },
  surface: { type: String, default: '#FFFFFF', maxlength: 20 },
  text: { type: String, default: '#111827', maxlength: 20 },
  border: { type: String, default: '#E5E7EB', maxlength: 20 },
  radius: { type: Number, default: 18, min: 8, max: 32 },
  buttonRadius: { type: Number, default: 12, min: 6, max: 24 },
  contentWidth: { type: Number, default: 1200, min: 980, max: 1500 },
  fontScale: { type: Number, default: 1, min: 0.9, max: 1.1 },
  shadow: { type: Number, default: 1, min: 0, max: 3 },
}, { _id: false });

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
  theme: { type: themeSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
