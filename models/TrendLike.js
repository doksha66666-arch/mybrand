const mongoose = require('mongoose');

const trendLikeSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'TrendPost', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

trendLikeSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('TrendLike', trendLikeSchema);
