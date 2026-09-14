const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['customer', 'assistant', 'agent', 'system'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const customerConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  customer: {
    name: { type: String, default: '', trim: true, maxlength: 120 },
    phone: { type: String, default: '', trim: true, maxlength: 40 },
    address: { type: String, default: '', trim: true, maxlength: 500 },
  },
  stage: {
    type: String,
    enum: ['chat', 'ordering', 'awaiting_customer', 'awaiting_agent', 'closed'],
    default: 'chat',
  },
  assignedToAgent: { type: Boolean, default: false },
  orderRequest: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, default: '' },
    variant: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1, max: 99 },
    notes: { type: String, default: '' },
  },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('CustomerConversation', customerConversationSchema);
