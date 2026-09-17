const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['customer', 'assistant', 'agent', 'system'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const chatConversationSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  status: { type: String, enum: ['bot', 'waiting_agent', 'agent', 'closed'], default: 'bot', index: true },
  customerName: { type: String, default: '', trim: true, maxlength: 120 },
  customerPhone: { type: String, default: '', trim: true, maxlength: 40 },
  messages: { type: [messageSchema], default: [] },
  orderDraft: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    variant: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  serviceDraft: {
    type: { type: String, enum: ['shipping','payment','return','exchange','complaint','product','order'], default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNumber: { type: String, default: '' },
    reason: { type: String, default: '' },
    note: { type: String, default: '' },
    ready: { type: Boolean, default: false },
  },
  lastMessageAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

chatConversationSchema.index({ status: 1, lastMessageAt: -1, updatedAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
