const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },

    image: { type: String, default: '' }, // صورة العرض داخل صفحات الفعالية
    bannerImage: { type: String, default: '' }, // بانر أوسع للصفحة الرئيسية

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },

    // الربط - كلها اختيارية، الفعالية ممكن تكون عامة بدون ربط أو مرتبطة بأي مما يلي
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    merchants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' }],

    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

campaignSchema.pre('validate', function (next) {
  if (this.endDate < this.startDate) {
    return next(new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية'));
  }
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
