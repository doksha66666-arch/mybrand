const mongoose = require('mongoose');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const { notifyCustomersAboutNewProduct } = require('../services/notificationService');

// A product is public when it is active and either:
// 1) it is a legacy/non-merchant product with an approved/empty status, or
// 2) it belongs to an approved merchant and is approved, pending, or out_of_stock.
// Rejected, hidden, and draft products stay private.
const PUBLIC_MERCHANT_PRODUCT_STATUSES = ['approved', 'pending', 'out_of_stock'];
const PUBLIC_LEGACY_PRODUCT_STATUS = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
const MAX_PAGE_SIZE = 100;
const PUBLIC_PRODUCT_FIELDS = ['nameAr', 'nameEn', 'descriptionAr', 'descriptionEn', 'slug', 'category', 'price', 'compareAtPrice', 'images', 'videoUrl', 'videoPoster', 'variants', 'stock', 'sku', 'isActive', 'isFeatured', 'tags'];
const ADMIN_PRODUCT_FIELDS = [...PUBLIC_PRODUCT_FIELDS, 'status', 'rejectionReason', 'commissionRateOverride', 'merchant'];
const MERCHANT_PRODUCT_FIELDS = ['nameAr', 'nameEn', 'descriptionAr', 'descriptionEn', 'slug', 'category', 'price', 'compareAtPrice', 'images', 'videoUrl', 'videoPoster', 'variants', 'stock', 'sku', 'isActive', 'isFeatured', 'tags'];
const MERCHANT_PRODUCT_LIST_FIELDS = ['nameAr', 'nameEn', 'slug', 'category', 'price', 'compareAtPrice', 'images', 'variants', 'stock', 'sku', 'status', 'createdAt'];

function pickAllowed(source, fields) {
  return fields.reduce((out, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
    return out;
  }, {});
}

function parsePagination(pageValue, limitValue, defaultLimit = 20) {
  const page = Math.max(1, Number.parseInt(pageValue, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(limitValue, 10) || defaultLimit));
  return { page, limit };
}

const getPublicMerchantFilter = async () => {
  const approvedMerchantIds = await Merchant.find({ status: 'approved' }).distinct('_id');
  return {
    $or: [
      {
        merchant: { $in: approvedMerchantIds },
        status: { $in: PUBLIC_MERCHANT_PRODUCT_STATUSES },
      },
      {
        $and: [
          { $or: [{ merchant: null }, { merchant: { $exists: false } }] },
          PUBLIC_LEGACY_PRODUCT_STATUS,
        ],
      },
    ],
  };
};

const populatePublicProduct = (query) => query
  .populate('category', 'nameAr nameEn slug')
  .populate('merchant', 'businessName storeName sellerLevel sellerRating sellerReviewCount');

exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const merchantFilter = await getPublicMerchantFilter();
    const filter = { isActive: true, $and: [merchantFilter] };
    if (category) filter.category = category;
    if (featured) filter.isFeatured = true;
    if (search) filter.$text = { $search: search };
    const products = await populatePublicProduct(Product.find(filter))
      .skip((page - 1) * limit)
      .limit(limit)
      .sort('-createdAt');
    const total = await Product.countDocuments(filter);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getProductBySlug = async (req, res, next) => {
  try {
    const merchantFilter = await getPublicMerchantFilter();
    const identifier = String(req.params.slug || '').trim();
    if (!identifier) return res.status(404).json({ message: 'المنتج غير موجود' });
    const identifierFilter = mongoose.isValidObjectId(identifier)
      ? { $or: [{ slug: identifier.toLowerCase() }, { _id: identifier }] }
      : { slug: identifier.toLowerCase() };
    const product = await populatePublicProduct(
      Product.findOne({ isActive: true, $and: [merchantFilter, identifierFilter] })
    );
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

exports.getAllProductsAdmin = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit, 20);
    const status = String(req.query.status || '').trim();
    const search = String(req.query.search || '').trim();
    const filter = {};
    if (['draft', 'pending', 'approved', 'rejected', 'hidden', 'out_of_stock'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^$()|[\]\\]/g, '\\exports.getAllProductsAdmin = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit, 100);
    const products = await Product.find({})
      .populate('category', 'nameAr nameEn slug')
      .populate({ path: 'merchant', populate: { path: 'user', select: 'name email' } })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort('-createdAt');
    const total = await Product.countDocuments({});
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};'), 'i');
      filter.$or = [{ nameAr: pattern }, { nameEn: pattern }, { slug: pattern }, { sku: pattern }];
    }
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'nameAr nameEn slug')
        .populate({ path: 'merchant', populate: { path: 'user', select: 'name email' } })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1, _id: -1 }),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getMyProducts = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit, 20);
    const search = String(req.query.search || '').trim();
    const filter = { merchant: req.merchant._id };
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ nameAr: pattern }, { nameEn: pattern }, { slug: pattern }];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(MERCHANT_PRODUCT_LIST_FIELDS.join(' '))
        .populate('category', 'nameAr nameEn slug')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getMyProductById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'المنتج غير موجود' });
    const product = await Product.findOne({ _id: req.params.id, merchant: req.merchant._id })
      .populate('category', 'nameAr nameEn slug');
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

exports.getPendingProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ status: 'pending' })
      .populate('category', 'nameAr nameEn slug')
      .populate({ path: 'merchant', populate: { path: 'user', select: 'name email' } })
      .sort('-createdAt');
    res.json({ products });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const payload = pickAllowed(req.body, req.user.role === 'admin' ? ADMIN_PRODUCT_FIELDS : MERCHANT_PRODUCT_FIELDS);
    if (req.user.role === 'merchant') {
      payload.merchant = req.merchant._id;
      payload.status = 'pending';
      payload.rejectionReason = '';
      delete payload.merchant;
    } else {
      payload.status = payload.status || 'approved';
    }
    const product = await Product.create({
      ...payload,
      ...(req.user.role === 'merchant'
        ? { merchant: req.merchant._id, status: 'pending', rejectionReason: '' }
        : {}),
    });
    if (product.status === 'approved' && product.isActive !== false) {
      notifyCustomersAboutNewProduct(product).catch((error) => console.error('New product notification failed:', error.message));
    }
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    if (req.user.role === 'merchant') {
      if (!product.merchant || product.merchant.toString() !== req.merchant._id.toString()) {
        return res.status(403).json({ message: 'لا يمكنك تعديل منتج لا تملكه' });
      }
      Object.assign(product, pickAllowed(req.body, MERCHANT_PRODUCT_FIELDS));
      product.status = 'pending';
      product.rejectionReason = '';
    } else {
      Object.assign(product, pickAllowed(req.body, ADMIN_PRODUCT_FIELDS));
    }
    await product.save();
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    if (req.user.role === 'merchant' && (!product.merchant || product.merchant.toString() !== req.merchant._id.toString())) {
      return res.status(403).json({ message: 'لا يمكنك حذف منتج لا تملكه' });
    }
    await product.deleteOne();
    res.json({ message: 'تم حذف المنتج' });
  } catch (err) {
    next(err);
  }
};

exports.reviewProduct = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'إجراء غير صالح' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    if (action === 'approve') {
      product.status = 'approved';
      product.rejectionReason = '';
    } else {
      product.status = 'rejected';
      product.rejectionReason = rejectionReason || 'لم يتم تحديد سبب';
    }
    await product.save();
    if (action === 'approve' && product.isActive !== false) {
      notifyCustomersAboutNewProduct(product).catch((error) => console.error('Approved product notification failed:', error.message));
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
};
