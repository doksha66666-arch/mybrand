const mongoose = require('mongoose');
const TrendPost = require('../models/TrendPost');
const TrendComment = require('../models/TrendComment');
const TrendLike = require('../models/TrendLike');
const Product = require('../models/Product');

// Remove only the legacy demo records created by the old Trend seed.
// Real Trend posts are never touched.
async function removeLegacyDemoData() {
  const legacy = await TrendPost.find({ seedKey: /^mybrand-demo-/ }).select('_id').lean();
  if (!legacy.length) return;
  const ids = legacy.map((post) => post._id);
  await TrendComment.deleteMany({ post: { $in: ids } });
  await TrendLike.deleteMany({ post: { $in: ids } });
  await TrendPost.deleteMany({ _id: { $in: ids } });
}

let legacyCleanupPromise;
function cleanupLegacyDemoDataOnce() {
  if (!legacyCleanupPromise) {
    legacyCleanupPromise = removeLegacyDemoData().catch((error) => {
      legacyCleanupPromise = null;
      throw error;
    });
  }
  return legacyCleanupPromise;
}

async function resolveProduct(productId) {
  if (!productId) return null;
  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('معرّف المنتج غير صحيح');
    error.statusCode = 400;
    throw error;
  }
  const product = await Product.findOne({ _id: productId, isActive: true, status: { $in: ['approved', 'out_of_stock'] } })
    .select('_id slug nameAr nameEn price compareAtPrice images videoUrl videoPoster isActive status')
    .lean();
  if (!product) {
    const error = new Error('المنتج المرتبط غير موجود أو غير متاح');
    error.statusCode = 400;
    throw error;
  }
  return product;
}

const serializePost = (post) => {
  const product = post.product && typeof post.product === 'object' ? post.product : null;
  return {
    ...post,
    id: String(post._id),
    productId: product?._id ? String(product._id) : post.product ? String(post.product) : null,
    productSlug: product?.slug || null,
    productName: product?.nameAr || product?.nameEn || '',
    productPrice: product?.price ?? null,
    productImage: product?.images?.[0] || product?.videoPoster || '',
  };
};

async function loadComments(posts) {
  const ids = posts.map((post) => post._id);
  const comments = ids.length
    ? await TrendComment.find({ post: { $in: ids } }).sort({ createdAt: 1 }).lean()
    : [];
  const grouped = comments.reduce((acc, comment) => {
    const key = String(comment.post);
    (acc[key] ||= []).push({ id: String(comment._id), name: comment.nameSnapshot, text: comment.text, createdAt: comment.createdAt });
    return acc;
  }, {});
  return posts.map((post) => ({ ...serializePost(post), comments: grouped[String(post._id)] || [] }));
}

exports.listPosts = async (req, res, next) => {
  try {
    await cleanupLegacyDemoDataOnce();
    const filter = { isPublished: true };
    if (req.query.type === 'reel') filter.type = 'reel';
    const posts = await TrendPost.find(filter)
      .populate('product', 'slug nameAr nameEn price compareAtPrice images videoUrl videoPoster isActive status')
      .sort({ createdAt: -1 }).lean();
    res.json({ posts: await loadComments(posts) });
  } catch (error) { next(error); }
};

exports.listMyLikes = async (req, res, next) => {
  try {
    const likes = await TrendLike.find({ user: req.user._id }).select('post').lean();
    res.json({ postIds: likes.map((like) => String(like.post)) });
  } catch (error) { next(error); }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const post = await TrendPost.findOne({ _id: req.params.postId, isPublished: true }).select('_id likes').lean();
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

    const existing = await TrendLike.findOne({ post: post._id, user: req.user._id }).select('_id').lean();
    if (existing) {
      await TrendLike.deleteOne({ _id: existing._id });
      const updated = await TrendPost.findByIdAndUpdate(post._id, { $inc: { likes: -1 } }, { new: true }).select('likes').lean();
      return res.json({ liked: false, likes: Math.max(0, Number(updated?.likes ?? post.likes ?? 0)) });
    }

    try {
      await TrendLike.create({ post: post._id, user: req.user._id });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const current = await TrendPost.findById(post._id).select('likes').lean();
      return res.json({ liked: true, likes: Number(current?.likes ?? post.likes ?? 0) });
    }

    const updated = await TrendPost.findByIdAndUpdate(post._id, { $inc: { likes: 1 } }, { new: true }).select('likes').lean();
    res.json({ liked: true, likes: Number(updated?.likes ?? (post.likes || 0) + 1) });
  } catch (error) { next(error); }
};

exports.addView = async (req, res, next) => {
  try {
    const post = await TrendPost.findOneAndUpdate(
      { _id: req.params.postId, type: 'reel', isPublished: true },
      { $inc: { views: 1 } },
      { new: true, projection: { views: 1 } }
    ).lean();
    if (!post) return res.status(404).json({ message: 'الريلز غير موجود' });
    res.status(200).json({ views: Number(post.views || 0) });
  } catch (error) { next(error); }
};

exports.addComment = async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'اكتب تعليقًا أولًا' });
    if (text.length > 300) return res.status(400).json({ message: 'التعليق طويل جدًا' });
    const post = await TrendPost.findOne({ _id: req.params.postId, isPublished: true });
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });
    const comment = await TrendComment.create({ post: post._id, user: req.user._id, nameSnapshot: req.user.name, text });
    res.status(201).json({ comment: { id: String(comment._id), name: comment.nameSnapshot, text: comment.text, createdAt: comment.createdAt } });
  } catch (error) { next(error); }
};

exports.adminListPosts = async (req, res, next) => {
  try {
    await cleanupLegacyDemoDataOnce();
    const posts = await TrendPost.find({})
      .populate('product', 'slug nameAr nameEn price compareAtPrice images videoUrl videoPoster isActive status')
      .sort({ createdAt: -1 }).lean();
    res.json({ posts: await loadComments(posts) });
  } catch (error) { next(error); }
};

exports.adminCreatePost = async (req, res, next) => {
  try {
    const type = req.body.type === 'reel' ? 'reel' : 'post';
    const author = String(req.body.author || '').trim();
    const text = String(req.body.text || '').trim();
    const image = String(req.body.image || '').trim();
    const videoUrl = String(req.body.videoUrl || '').trim();
    const product = await resolveProduct(req.body.productId);
    if (!author || !text || !image) return res.status(400).json({ message: 'الكاتب والنص وصورة الغلاف مطلوبة' });
    if (type === 'reel' && !videoUrl) return res.status(400).json({ message: 'فيديو الريلز مطلوب' });
    if (text.length > 5000) return res.status(400).json({ message: 'نص المنشور طويل جدًا' });
    const post = await TrendPost.create({
      type, author, text, image, videoUrl,
      product: product?._id || null,
      timeLabel: 'الآن', likes: 0, views: 0,
      isPublished: req.body.isPublished !== false,
    });
    const populated = await TrendPost.findById(post._id)
      .populate('product', 'slug nameAr nameEn price compareAtPrice images videoUrl videoPoster isActive status').lean();
    res.status(201).json({ post: serializePost(populated) });
  } catch (error) { next(error); }
};

exports.adminUpdatePost = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.type !== undefined) updates.type = req.body.type === 'reel' ? 'reel' : 'post';
    for (const field of ['author', 'text', 'image', 'videoUrl', 'timeLabel']) {
      if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim();
    }
    if (req.body.isPublished !== undefined) updates.isPublished = Boolean(req.body.isPublished);
    if (req.body.productId !== undefined) {
      const product = await resolveProduct(req.body.productId);
      updates.product = product?._id || null;
    }
    const post = await TrendPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });
    Object.assign(post, updates);
    if (post.type === 'reel' && !post.videoUrl) return res.status(400).json({ message: 'فيديو الريلز مطلوب' });
    if (!post.image) return res.status(400).json({ message: 'صورة الغلاف مطلوبة' });
    await post.save();
    const populated = await TrendPost.findById(post._id)
      .populate('product', 'slug nameAr nameEn price compareAtPrice images videoUrl videoPoster isActive status').lean();
    res.json({ post: serializePost(populated) });
  } catch (error) { next(error); }
};

exports.adminSetPublished = async (req, res, next) => {
  try {
    const post = await TrendPost.findByIdAndUpdate(req.params.postId, { $set: { isPublished: Boolean(req.body.isPublished) } }, { new: true })
      .populate('product', 'slug nameAr nameEn price compareAtPrice images videoUrl videoPoster isActive status').lean();
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });
    res.json({ post: serializePost(post) });
  } catch (error) { next(error); }
};

exports.adminDeletePost = async (req, res, next) => {
  try {
    const post = await TrendPost.findByIdAndDelete(req.params.postId);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });
    await TrendComment.deleteMany({ post: post._id });
    await TrendLike.deleteMany({ post: post._id });
    res.json({ message: 'تم حذف المنشور وتفاعلاته نهائيًا' });
  } catch (error) { next(error); }
};

exports.adminDeleteComment = async (req, res, next) => {
  try {
    const comment = await TrendComment.findByIdAndDelete(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'التعليق غير موجود' });
    res.json({ message: 'تم حذف التعليق' });
  } catch (error) { next(error); }
};
