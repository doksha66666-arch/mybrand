const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: String,
  value: String,
  image: { type: String, default: '' },
  priceModifier: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sku: String,
}, { _id: true });

const normalizeVariantGroup = (name) => String(name || '').trim().toLocaleLowerCase('ar-EG');
const deriveAvailableStock = (variants = []) => {
  if (!Array.isArray(variants) || !variants.length) return 0;
  const groups = new Map();
  for (const variant of variants) {
    const key = normalizeVariantGroup(variant?.name || variant?.optionName || 'option');
    const stock = Math.max(0, Number(variant?.stock ?? 0));
    groups.set(key, (groups.get(key) || 0) + (Number.isFinite(stock) ? stock : 0));
  }
  const totals = [...groups.values()];
  return totals.length ? Math.max(0, Math.floor(Math.min(...totals))) : 0;
};
const touchesVariantStock = (update = {}) => {
  return ['$inc', '$set', '$unset', '$push', '$pull', '$addToSet'].some((operator) => {
    const payload = update?.[operator];
    return payload && typeof payload === 'object' && Object.keys(payload).some((path) => path === 'variants' || path.startsWith('variants.'));
  });
};

const productSchema = new mongoose.Schema({
  nameAr: { type: String, required: true, trim: true },
  nameEn: { type: String, required: true, trim: true },
  descriptionAr: { type: String, default: '' },
  descriptionEn: { type: String, default: '' },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: null },
  images: [{ type: String }],
  videoUrl: { type: String, default: '' },
  videoPoster: { type: String, default: '' },
  variants: [variantSchema],
  stock: { type: Number, default: 0 },
  sku: { type: String, unique: true, sparse: true },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'hidden', 'out_of_stock'],
    default: 'approved',
  },
  rejectionReason: { type: String, default: '' },
  commissionRateOverride: { type: Number, default: null, min: 0, max: 100 },
}, { timestamps: true });

productSchema.pre('save', function syncVariantStockBeforeSave(next) {
  if (this.isModified('variants') && Array.isArray(this.variants) && this.variants.length) {
    this.stock = deriveAvailableStock(this.variants);
  }
  next();
});

productSchema.post('findOneAndUpdate', async function syncVariantStockAfterUpdate(doc) {
  try {
    if (!doc || !touchesVariantStock(this.getUpdate())) return;
    const nextStock = deriveAvailableStock(doc.variants);
    if (Number(doc.stock) === nextStock) return;
    await doc.updateOne({ $set: { stock: nextStock } });
  } catch (error) {
    console.error('Failed to synchronize product stock from variants:', error);
  }
});

productSchema.index({ nameAr: 'text', nameEn: 'text', tags: 'text' });
// Fast public category browsing: active + approval + category + newest first.
productSchema.index({ category: 1, isActive: 1, status: 1, createdAt: -1 });
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
