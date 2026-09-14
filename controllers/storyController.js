const Story = require('../models/Story');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');

const populateStory = (q) => q.populate('product', 'slug nameAr nameEn price images').populate('merchant', 'businessName storeName');

function serialize(story) {
  const product = story.product && typeof story.product === 'object' ? story.product : null;
  const merchant = story.merchant && typeof story.merchant === 'object' ? story.merchant : null;
  return {
    id: String(story._id), ownerType: story.ownerType, ownerName: story.ownerName,
    merchantId: merchant?._id ? String(merchant._id) : story.merchant ? String(story.merchant) : null,
    mediaType: story.mediaType, mediaUrl: story.mediaUrl, caption: story.caption || '',
    productId: product?._id ? String(product._id) : story.product ? String(story.product) : null,
    productSlug: product?.slug || null, productName: product?.nameAr || product?.nameEn || '',
    productPrice: product?.price ?? null, productImage: Array.isArray(product?.images) ? (product.images[0] || null) : null,
    isPublished: story.isPublished !== false, startsAt: story.startsAt, expiresAt: story.expiresAt, createdAt: story.createdAt,
  };
}

async function productForMerchant(productId, merchantId) {
  if (!productId) return null;
  return Product.findOne({
    _id: productId,
    merchant: merchantId,
    isActive: true,
    status: { $in: ['approved', 'out_of_stock'] },
  }).select('_id slug').lean();
}

exports.listPublic = async (req, res, next) => {
  try {
    const now = new Date();
    const stories = await populateStory(Story.find({ isPublished: true, startsAt: { $lte: now }, expiresAt: { $gt: now } }).sort({ ownerName: 1, createdAt: 1 })).lean();
    const groups = []; const byOwner = new Map();
    for (const story of stories) {
      const key = `${story.ownerType}:${story.merchant || 'admin'}`;
      if (!byOwner.has(key)) { const group = { id: key, ownerType: story.ownerType, ownerName: story.ownerName, stories: [] }; byOwner.set(key, group); groups.push(group); }
      byOwner.get(key).stories.push(serialize(story));
    }
    res.json({ groups });
  } catch (error) { next(error); }
};

exports.adminList = async (req, res, next) => {
  try { const stories = await populateStory(Story.find({}).sort({ createdAt: -1 })); res.json({ stories: stories.map(serialize) }); } catch (e) { next(e); }
};
exports.merchantList = async (req, res, next) => {
  try { const stories = await populateStory(Story.find({ ownerType: 'merchant', merchant: req.merchant._id }).sort({ createdAt: -1 })); res.json({ stories: stories.map(serialize) }); } catch (e) { next(e); }
};

async function create(req, ownerType, merchantId) {
  const mediaUrl = String(req.body.mediaUrl || '').trim();
  const mediaType = req.body.mediaType === 'video' ? 'video' : 'image';
  const caption = String(req.body.caption || '').trim();
  if (!mediaUrl) { const e = new Error('رابط الصورة أو الفيديو مطلوب'); e.statusCode = 400; throw e; }
  const durationHours = Math.min(168, Math.max(1, Number(req.body.durationHours || 24)));
  const expiresAt = new Date(Date.now() + durationHours * 3600000);
  let merchant = null; let ownerName = 'MYBRAND'; let product = null;
  if (ownerType === 'merchant') {
    merchant = await Merchant.findById(merchantId).select('_id businessName storeName status');
    if (!merchant || merchant.status !== 'approved') { const e = new Error('التاجر غير معتمد'); e.statusCode = 403; throw e; }
    ownerName = merchant.storeName || merchant.businessName || 'التاجر';
    if (req.body.productId) {
      product = await productForMerchant(req.body.productId, merchant._id);
      if (!product) { const e = new Error('المنتج غير متاح أو لا يخص متجرك'); e.statusCode = 403; throw e; }
    }
  } else if (req.body.merchantId) {
    merchant = await Merchant.findById(req.body.merchantId).select('_id businessName storeName');
    if (!merchant) { const e = new Error('التاجر غير موجود'); e.statusCode = 404; throw e; }
    ownerName = merchant.storeName || merchant.businessName || 'التاجر';
    if (req.body.productId) product = await Product.findOne({ _id: req.body.productId, merchant: merchant._id }).select('_id');
  }
  return Story.create({ ownerType, merchant: merchant?._id || null, ownerName, mediaType, mediaUrl, caption, product: product?._id || null, isPublished: req.body.isPublished !== false, expiresAt });
}

exports.adminCreate = async (req, res, next) => { try { const story = await create(req, 'admin', null); const populated = await populateStory(Story.findById(story._id)).lean(); res.status(201).json({ story: serialize(populated) }); } catch (e) { next(e); } };
exports.merchantCreate = async (req, res, next) => { try { const story = await create(req, 'merchant', req.merchant._id); const populated = await populateStory(Story.findById(story._id)).lean(); res.status(201).json({ story: serialize(populated) }); } catch (e) { next(e); } };

exports.adminUpdate = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id); if (!story) return res.status(404).json({ message: 'القصة غير موجودة' });
    if (req.body.mediaUrl !== undefined) story.mediaUrl = String(req.body.mediaUrl).trim();
    if (req.body.mediaType !== undefined) story.mediaType = req.body.mediaType === 'video' ? 'video' : 'image';
    if (req.body.caption !== undefined) story.caption = String(req.body.caption).trim();
    if (req.body.isPublished !== undefined) story.isPublished = Boolean(req.body.isPublished);
    if (req.body.productId !== undefined) {
      if (!req.body.productId) story.product = null;
      else { const product = await Product.findById(req.body.productId).select('_id'); if (!product) return res.status(404).json({ message: 'المنتج غير موجود' }); story.product = product._id; }
    }
    if (req.body.durationHours !== undefined) story.expiresAt = new Date(Date.now() + Math.min(168, Math.max(1, Number(req.body.durationHours || 24))) * 3600000);
    await story.save(); const populated = await populateStory(Story.findById(story._id)).lean(); res.json({ story: serialize(populated) });
  } catch (e) { next(e); }
};

exports.merchantUpdate = async (req, res, next) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, ownerType: 'merchant', merchant: req.merchant._id }); if (!story) return res.status(404).json({ message: 'القصة غير موجودة' });
    if (req.body.mediaUrl !== undefined) story.mediaUrl = String(req.body.mediaUrl).trim();
    if (req.body.mediaType !== undefined) story.mediaType = req.body.mediaType === 'video' ? 'video' : 'image';
    if (req.body.caption !== undefined) story.caption = String(req.body.caption).trim();
    if (req.body.isPublished !== undefined) story.isPublished = Boolean(req.body.isPublished);
    if (req.body.productId !== undefined) {
      if (!req.body.productId) story.product = null;
      else { const product = await productForMerchant(req.body.productId, req.merchant._id); if (!product) return res.status(403).json({ message: 'المنتج غير متاح أو لا يخص متجرك' }); story.product = product._id; }
    }
    if (req.body.durationHours !== undefined) story.expiresAt = new Date(Date.now() + Math.min(168, Math.max(1, Number(req.body.durationHours || 24))) * 3600000);
    await story.save(); const populated = await populateStory(Story.findById(story._id)).lean(); res.json({ story: serialize(populated) });
  } catch (e) { next(e); }
};
exports.adminDelete = async (req, res, next) => { try { const r = await Story.findByIdAndDelete(req.params.id); if (!r) return res.status(404).json({ message: 'القصة غير موجودة' }); res.json({ message: 'تم حذف القصة' }); } catch(e){ next(e); } };
exports.merchantDelete = async (req, res, next) => { try { const r = await Story.findOneAndDelete({ _id: req.params.id, ownerType:'merchant', merchant:req.merchant._id }); if (!r) return res.status(404).json({ message:'القصة غير موجودة' }); res.json({ message:'تم حذف القصة' }); } catch(e){ next(e); } };