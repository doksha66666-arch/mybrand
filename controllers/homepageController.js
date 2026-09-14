const Product = require('../models/Product');
const Category = require('../models/Category');
const Campaign = require('../models/Campaign');
const Merchant = require('../models/Merchant');
const { attachPricing } = require('../utils/pricing');

// Approved merchants may have products in moderation-pending state; active products
// from those merchants should still appear in the public storefront/homepage.
const APPROVED_MERCHANT_PRODUCT_FILTER = async () => {
  const approvedMerchantIds = await Merchant.find({ status: 'approved' }).distinct('_id');
  return {
    $or: [
      {
        merchant: { $in: approvedMerchantIds },
        status: { $in: ['approved', 'pending', 'out_of_stock'] },
      },
      {
        $and: [
          { $or: [{ merchant: null }, { merchant: { $exists: false } }] },
          { $or: [{ status: 'approved' }, { status: { $exists: false } }] },
        ],
      },
    ],
  };
};
const PUBLIC_EXCLUDED_FIELDS = '-commissionRateOverride';

// GET /api/homepage - عام - كل محتوى الصفحة الرئيسية في استدعاء واحد
// البنر القديم أُلغي من واجهة المتجر، لذلك لا يتم كشف سجلاته للمتجر العام.
exports.getHomepage = async (req, res, next) => {
  try {
    const now = new Date();
    const publicProductFilter = await APPROVED_MERCHANT_PRODUCT_FILTER();

    const [campaigns, categories, featured, newest, candidatesForDiscount] = await Promise.all([
      Campaign.find({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } })
        .populate('products', 'nameAr slug images price')
        .sort('sortOrder')
        .limit(6),
      Category.find({ isActive: true }).sort('sortOrder'),
      Product.find({ isActive: true, isFeatured: true, ...publicProductFilter })
        .select(PUBLIC_EXCLUDED_FIELDS)
        .populate('category', 'nameAr slug')
        .sort('-createdAt')
        .limit(8),
      Product.find({ isActive: true, ...publicProductFilter })
        .select(PUBLIC_EXCLUDED_FIELDS)
        .populate('category', 'nameAr slug')
        .sort('-createdAt')
        .limit(8),
      Product.find({ isActive: true, ...publicProductFilter })
        .select(PUBLIC_EXCLUDED_FIELDS)
        .populate('category', 'nameAr slug')
        .sort('-createdAt')
        .limit(50),
    ]);

    const [featuredWithPricing, newestWithPricing, discountCandidates] = await Promise.all([
      attachPricing(featured),
      attachPricing(newest),
      attachPricing(candidatesForDiscount),
    ]);

    const discounted = discountCandidates.filter((p) => p.discountAmount > 0).slice(0, 8);

    res.json({
      banners: [],
      campaigns,
      categories,
      featuredProducts: featuredWithPricing,
      newProducts: newestWithPricing,
      discountedProducts: discounted,
    });
  } catch (err) {
    next(err);
  }
};
