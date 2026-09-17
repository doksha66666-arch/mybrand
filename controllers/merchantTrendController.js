const mongoose = require('mongoose');
const TrendPost = require('../models/TrendPost');
const TrendComment = require('../models/TrendComment');
const TrendLike = require('../models/TrendLike');
const TrendEvent = require('../models/TrendEvent');
const Product = require('../models/Product');

const productSelect = 'slug nameAr nameEn price compareAtPrice images videoUrl videoPoster isActive status merchant';

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

const loadComments = async (posts) => {
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
};

const resolveMerchantProduct = async (merchantId, productId) => {
  if (!productId) return null;
  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('معرّف المنتج غير صحيح');
    error.statusCode = 400;
    throw error;
  }
  const product = await Product.findOne({
    _id: productId,
    merchant: merchantId,
    isActive: true,
    status: { $in: ['approved', 'out_of_stock'] },
  }).select(productSelect).lean();
  if (!product) {
    const error = new Error('المنتج غير متاح أو لا يخص متجرك');
    error.statusCode = 400;
    throw error;
  }
  return product;
};

exports.listMyPosts = async (req, res, next) => {
  try {
    const posts = await TrendPost.find({ merchant: req.merchant._id })
      .populate('product', productSelect)
      .sort({ createdAt: -1 }).lean();
    res.json({ posts: await loadComments(posts) });
  } catch (error) { next(error); }
};

exports.createPost = async (req, res, next) => {
  try {
    const type = req.body.type === 'reel' ? 'reel' : 'post';
    const author = String(req.body.author || req.merchant.businessName || req.user.name || '').trim();
    const text = String(req.body.text || '').trim();
    const image = String(req.body.image || '').trim();
    const videoUrl = String(req.body.videoUrl || '').trim();
    const product = await resolveMerchantProduct(req.merchant._id, req.body.productId);
    if (!author || !text || !image) return res.status(400).json({ message: 'الكاتب والنص وصورة الغلاف مطلوبة' });
    if (type === 'reel' && !videoUrl) return res.status(400).json({ message: 'فيديو الريلز مطلوب' });
    if (text.length > 5000) return res.status(400).json({ message: 'نص المنشور طويل جدًا' });
    const post = await TrendPost.create({
      type, author, text, image, videoUrl,
      product: product?._id || null,
      merchant: req.merchant._id,
      timeLabel: 'الآن', likes: 0, views: 0,
      // Respect the merchant dashboard's explicit publish choice; default to public.
      isPublished: req.body.isPublished !== false,
    });
    const populated = await TrendPost.findById(post._id).populate('product', productSelect).lean();
    res.status(201).json({ post: serializePost(populated) });
  } catch (error) { next(error); }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await TrendPost.findOne({ _id: req.params.postId, merchant: req.merchant._id });
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });
    const updates = {};
    for (const field of ['author', 'text', 'image', 'videoUrl']) {
      if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim();
    }
    if (req.body.type !== undefined) updates.type = req.body.type === 'reel' ? 'reel' : 'post';
    // Keep merchant-created content public by default; an explicit false can still hide it later.
    if (req.body.isPublished !== undefined) updates.isPublished = Boolean(req.body.isPublished);
    if (req.body.productId !== undefined) {
      const product = await resolveMerchantProduct(req.merchant._id, req.body.productId);
      updates.product = product?._id || null;
    }
    Object.assign(post, updates);
    if (!post.author || !post.text || !post.image) return res.status(400).json({ message: 'الكاتب والنص وصورة الغلاف مطلوبة' });
    if (post.type === 'reel' && !post.videoUrl) return res.status(400).json({ message: 'فيديو الريلز مطلوب' });
    if (post.text.length > 5000) return res.status(400).json({ message: 'نص المنشور طويل جدًا' });
    await post.save();
    const populated = await TrendPost.findById(post._id).populate('product', productSelect).lean();
    res.json({ post: serializePost(populated) });
  } catch (error) { next(error); }
};

exports.setPostPublished = async (req, res, next) => {
  try {
    const post = await TrendPost.findOneAndUpdate(
      { _id: req.params.postId, merchant: req.merchant._id },
      { $set: { isPublished: Boolean(req.body.isPublished) } },
      { new: true }
    ).populate('product', productSelect).lean();
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });
    res.json({ post: serializePost(post) });
  } catch (error) { next(error); }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await TrendPost.findOneAndDelete({ _id: req.params.postId, merchant: req.merchant._id });
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });
    await TrendComment.deleteMany({ post: post._id });
    await TrendLike.deleteMany({ post: post._id });
    res.json({ message: 'تم حذف المنشور وتفاعلاته نهائيًا' });
  } catch (error) { next(error); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await TrendComment.findById(req.params.commentId).select('post');
    if (!comment) return res.status(404).json({ message: 'التعليق غير موجود' });
    const ownsPost = await TrendPost.exists({ _id: comment.post, merchant: req.merchant._id });
    if (!ownsPost) return res.status(403).json({ message: 'لا يمكنك حذف هذا التعليق' });
    await TrendComment.deleteOne({ _id: comment._id });
    res.json({ message: 'تم حذف التعليق' });
  } catch (error) { next(error); }
};

exports.listMyEvents = async (req, res, next) => {
  try {
    const events = await TrendEvent.find({ merchant: req.merchant._id }).sort({ startsAt: 1 }).lean();
    res.json({ events: events.map((event) => ({ ...event, id: String(event._id) })) });
  } catch (error) { next(error); }
};

exports.createEvent = async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const image = String(req.body.image || '').trim();
    const startsAt = new Date(req.body.startsAt);
    const endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
    if (!title || !image || Number.isNaN(startsAt.getTime())) return res.status(400).json({ message: 'اسم الفعالية والصورة وتاريخ البداية مطلوبة' });
    if (endsAt && Number.isNaN(endsAt.getTime())) return res.status(400).json({ message: 'تاريخ النهاية غير صحيح' });
    if (endsAt && endsAt <= startsAt) return res.status(400).json({ message: 'تاريخ النهاية يجب أن يكون بعد البداية' });
    const event = await TrendEvent.create({ title, description, image, startsAt, endsAt, merchant: req.merchant._id, isPublished: true });
    res.status(201).json({ event: { ...event.toObject(), id: String(event._id) } });
  } catch (error) { next(error); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await TrendEvent.findOne({ _id: req.params.eventId, merchant: req.merchant._id });
    if (!event) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    for (const field of ['title', 'description', 'image']) if (req.body[field] !== undefined) event[field] = String(req.body[field]).trim();
    if (req.body.startsAt !== undefined) event.startsAt = new Date(req.body.startsAt);
    if (req.body.endsAt !== undefined) event.endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
    if (req.body.isPublished !== undefined) event.isPublished = Boolean(req.body.isPublished);
    if (!event.title || !event.image || Number.isNaN(new Date(event.startsAt).getTime())) return res.status(400).json({ message: 'بيانات الفعالية غير مكتملة' });
    if (event.endsAt && (Number.isNaN(new Date(event.endsAt).getTime()) || event.endsAt <= event.startsAt)) return res.status(400).json({ message: 'تواريخ الفعالية غير صحيحة' });
    await event.save();
    res.json({ event: { ...event.toObject(), id: String(event._id) } });
  } catch (error) { next(error); }
};

exports.setEventPublished = async (req, res, next) => {
  try {
    const event = await TrendEvent.findOneAndUpdate(
      { _id: req.params.eventId, merchant: req.merchant._id },
      { $set: { isPublished: Boolean(req.body.isPublished) } },
      { new: true }
    ).lean();
    if (!event) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    res.json({ event: { ...event, id: String(event._id) } });
  } catch (error) { next(error); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await TrendEvent.findOneAndDelete({ _id: req.params.eventId, merchant: req.merchant._id });
    if (!event) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    res.json({ message: 'تم حذف الفعالية نهائيًا' });
  } catch (error) { next(error); }
};
