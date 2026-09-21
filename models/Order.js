const mongoose = require('mongoose');
const PaymentSettings = require('./PaymentSettings');
const Merchant = require('./Merchant');
const { storage } = require('../services/loyaltyRequestContext');
const { reserveRedemption, finalizeRedemption, releaseRedemption } = require('../services/loyaltyService');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  nameSnapshot: { type: String, required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  selectedOptions: { type: mongoose.Schema.Types.Mixed, default: {} },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null },
  merchantNameSnapshot: { type: String, default: '' },
  sellerLevelSnapshot: { type: String, enum: ['beginner', 'featured', 'five_star'], default: 'beginner' },
  sellerRatingSnapshot: { type: Number, default: 0, min: 0, max: 5 },
  sellerReviewCountSnapshot: { type: Number, default: 0, min: 0 },
  commissionRate: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  merchantAmount: { type: Number, default: 0 },
  imageSnapshot: { type: String, default: '' },
  productCodeSnapshot: { type: String, default: '' },
  notesSnapshot: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  customer: { name: String, phone: String, email: String },
  shippingAddress: { country: String, governorate: String, center: String, city: String, street: String, building: String, postalCode: String, notes: String },
  subtotal: { type: Number, required: true }, discount: { type: Number, default: 0 },
  loyaltyPointsRedeemed: { type: Number, default: 0, min: 0 }, loyaltyDiscount: { type: Number, default: 0, min: 0 },
  shippingFee: { type: Number, default: 0 }, total: { type: Number, required: true },
  totalCommissionAmount: { type: Number, default: 0 }, totalMerchantAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cod', 'card', 'wallet', 'vodafone_cash'], default: 'cod' },
  vodafoneCashInfo: { senderPhone: { type: String, default: '' }, transactionRef: { type: String, default: '' } },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  couponCode: { type: String, trim: true, uppercase: true, default: null }, placedAt: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false, index: true }, archivedAt: { type: Date, default: null },
  dailyReport: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyOrderReport', default: null },
}, { timestamps: true });

// Main admin list: filter active orders and return newest first without a collection scan.
orderSchema.index({ isArchived: 1, createdAt: -1 });
// Admin order status filters: scope active/archived orders and keep newest-first ordering indexable.
orderSchema.index({ isArchived: 1, status: 1, createdAt: -1 });
// Merchant fulfillment: narrow by merchant/status and keep newest orders first.
orderSchema.index({ 'items.merchant': 1, status: 1, createdAt: -1 });
// Merchant sales: scope by merchant and keep newest orders first.
orderSchema.index({ 'items.merchant': 1, createdAt: -1 });

orderSchema.pre('save', async function snapshotSellerData() {
  if (!this.isNew || !this.items?.length) return;
  const merchantIds = [...new Set(this.items.map((item) => item.merchant).filter(Boolean).map((id) => String(id)))];
  if (!merchantIds.length) return;
  const merchants = await Merchant.find({ _id: { $in: merchantIds } }).select('businessName storeName sellerLevel sellerRating sellerReviewCount').lean();
  const byId = new Map(merchants.map((merchant) => [String(merchant._id), merchant]));
  this.items.forEach((item) => {
    const merchant = byId.get(String(item.merchant));
    if (!merchant) return;
    item.merchantNameSnapshot = merchant.storeName || merchant.businessName || '';
    item.sellerLevelSnapshot = merchant.sellerLevel || 'beginner';
    item.sellerRatingSnapshot = Number(merchant.sellerRating || 0);
    item.sellerReviewCountSnapshot = Number(merchant.sellerReviewCount || 0);
  });
});

orderSchema.pre('save', async function loyaltyBeforeSave() {
  if (!this.isNew) return; const ctx = storage.getStore(); const requestedPoints = Math.max(0, Math.floor(Number(ctx?.requestedPoints || 0))); if (!requestedPoints) return;
  const merchandiseAmount = Math.max(0, Number(this.subtotal || 0) - Number(this.discount || 0)); const reserved = await reserveRedemption({ userId: this.user, requestedPoints, merchandiseAmount });
  this.loyaltyPointsRedeemed = reserved.points; this.loyaltyDiscount = reserved.discount; this.total = Math.max(0, Math.round((Number(this.total || 0) - reserved.discount) * 100) / 100); this.$locals.loyaltyReservationId = reserved.reservationId;
});
orderSchema.post('save', async function loyaltyAfterSave() { if (this.$locals.loyaltyReservationId) { try { await finalizeRedemption(this.$locals.loyaltyReservationId, this._id); } catch (error) { console.error('Failed to finalize loyalty redemption:', error); } } });
orderSchema.post('save', async function loyaltySaveError(error, _doc, next) { if (error && this?.$locals?.loyaltyReservationId) { try { await releaseRedemption(this.$locals.loyaltyReservationId, 'فشل حفظ الطلب وإعادة نقاط الولاء'); } catch (releaseError) { console.error('Failed to release loyalty reservation:', releaseError); } } next(error); });
orderSchema.pre('save', async function enforceCodLimitAfterLoyalty() {
  if (this.paymentMethod !== 'cod' || !Number.isFinite(Number(this.total))) return;
  const settings = await PaymentSettings.findOne({ key: 'global' }).lean();
  if (!settings?.codLimitEnabled) return;
  const rawLimit = String(settings.codLimit ?? '').trim().replace(/,/g, '');
  const codLimit = Number(rawLimit);
  if (!Number.isFinite(codLimit) || codLimit <= 0 || Number(this.total) <= codLimit) return;

  const reservationId = this.$locals.loyaltyReservationId;
  if (reservationId) {
    try {
      await releaseRedemption(reservationId, 'تجاوز الحد الأقصى للدفع عند الاستلام');
    } catch (releaseError) {
      console.error('Failed to release loyalty reservation after COD limit rejection:', releaseError);
    }
    this.$locals.loyaltyReservationId = null;
  }

  const error = new Error(`الحد الأقصى للدفع عند الاستلام هو ${codLimit} ج.م`);
  error.statusCode = 409;
  error.code = 'COD_LIMIT_EXCEEDED';
  throw error;
});
module.exports = mongoose.model('Order', orderSchema);