const mongoose = require('mongoose');

const trendCommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'TrendPost', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  nameSnapshot: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true, maxlength: 300 },
}, { timestamps: true });

module.exports = mongoose.model('TrendComment', trendCommentSchema);
