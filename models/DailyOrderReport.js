const mongoose = require('mongoose');

const dailyOrderReportSchema = new mongoose.Schema({
  reportDate: { type: String, required: true, unique: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  orders: { type: [mongoose.Schema.Types.Mixed], default: [] },
  orderCount: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalShipping: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  totalMerchantAmount: { type: Number, default: 0 },
  paymentSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  statusSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  merchantSummary: { type: [mongoose.Schema.Types.Mixed], default: [] },
  archivedOrderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  generatedAt: { type: Date, default: Date.now },
  archivedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('DailyOrderReport', dailyOrderReportSchema);
