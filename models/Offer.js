const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, default: '' },

    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },

    // نطاق العرض: منتج معيّن / قسم كامل / تاجر كامل / المتجر كله
    scope: { type: String, enum: ['product', 'category', 'merchant', 'store'], required: true },
    targetProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    targetCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    targetMerchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', default: null },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // شروط إضافية
    minOrderAmount: { type: Number, default: 0 }, // الحد الأدنى لقيمة الطلب (يُطبَّق فقط على عروض "المتجر كله")
    maxDiscountAmount: { type: Number, default: null }, // سقف قيمة الخصم بالجنيه، null = بدون سقف

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// التأكد من وجود الهدف المناسب لكل نطاق قبل الحفظ
offerSchema.pre('validate', function (next) {
  if (this.scope === 'product' && !this.targetProduct) {
    return next(new Error('يجب تحديد المنتج المشمول بالعرض'));
  }
  if (this.scope === 'category' && !this.targetCategory) {
    return next(new Error('يجب تحديد القسم المشمول بالعرض'));
  }
  if (this.scope === 'merchant' && !this.targetMerchant) {
    return next(new Error('يجب تحديد التاجر المشمول بالعرض'));
  }
  if (this.endDate < this.startDate) {
    return next(new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية'));
  }
  next();
});

module.exports = mongoose.model('Offer', offerSchema);
