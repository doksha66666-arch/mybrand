const mongoose = require('mongoose');

const trendPostSchema = new mongoose.Schema({
  seedKey: { type: String, unique: true, sparse: true, index: true },
  type: { type: String, enum: ['post', 'reel'], default: 'post', index: true },
  author: { type: String, required: true, trim: true },
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null, index: true },
  timeLabel: { type: String, default: '' },
  text: { type: String, required: true, trim: true },
  image: { type: String, default: '', trim: true },
  videoUrl: { type: String, default: '', trim: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
  likes: { type: Number, default: 0, min: 0 },
  views: { type: Number, default: 0, min: 0 },
  isPublished: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('TrendPost', trendPostSchema);
