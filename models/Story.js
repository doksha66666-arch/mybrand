const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  ownerType: { type: String, enum: ['admin', 'merchant'], required: true, index: true },
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null, index: true },
  ownerName: { type: String, required: true, trim: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  mediaUrl: { type: String, required: true, trim: true },
  caption: { type: String, default: '', trim: true, maxlength: 500 },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  isPublished: { type: Boolean, default: true, index: true },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

storySchema.index({ isPublished: 1, expiresAt: 1, createdAt: -1 });
module.exports = mongoose.model('Story', storySchema);
