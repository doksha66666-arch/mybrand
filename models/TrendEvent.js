const mongoose = require('mongoose');

const trendEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  image: { type: String, required: true, trim: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, default: null },
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null, index: true },
  isPublished: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('TrendEvent', trendEventSchema);
