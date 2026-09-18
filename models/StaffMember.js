const mongoose = require('mongoose');

const staffMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  phone: { type: String, trim: true, maxlength: 40 },
  role: { type: String, enum: ['super_admin', 'orders_manager', 'products_manager', 'marketing_manager', 'support', 'accountant', 'cashier', 'viewer'], default: 'viewer' },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

staffMemberSchema.index({ email: 1 });
staffMemberSchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('StaffMember', staffMemberSchema);
