const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer', 'admin'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 4000 },
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, enum: ['order', 'payment', 'account', 'return', 'merchant', 'other'], default: 'other' },
  status: { type: String, enum: ['new', 'in_progress', 'closed'], default: 'new', index: true },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
