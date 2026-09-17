const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true, trim: true },
  storeName: { type: String, trim: true, default: '' },
  businessPhone: { type: String, trim: true },
  businessDescription: { type: String, default: '' },
  businessAddress: { type: String, default: '' },
  governorate: { type: String, trim: true },
  center: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
  sellerLevel: { type: String, enum: ['beginner', 'featured', 'five_star'], default: 'beginner', index: true },
  sellerRating: { type: Number, default: 0, min: 0, max: 5 },
  sellerReviewCount: { type: Number, default: 0, min: 0 },
  commissionRate: { type: Number, default: 15, min: 0, max: 100 },
  suspensionReason: { type: String, default: '' },
  approvedAt: { type: Date, default: null },
  suspendedAt: { type: Date, default: null },
}, { timestamps: true });

merchantSchema.index({ createdAt: -1 });
merchantSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Merchant', merchantSchema);
