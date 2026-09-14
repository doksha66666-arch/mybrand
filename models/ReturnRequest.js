const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  type: { type: String, enum: ['return', 'exchange'], default: 'return' },
  status: { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected', 'completed'], default: 'pending' },
  note: { type: String, default: '', maxlength: 2000 },
  adminNote: { type: String, default: '', maxlength: 2000 },
}, { timestamps: true });

returnRequestSchema.index({ user: 1, createdAt: -1 });
returnRequestSchema.index({ order: 1 });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
