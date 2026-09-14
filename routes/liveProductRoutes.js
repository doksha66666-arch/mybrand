const express = require('express');
const mongoose = require('mongoose');
const LiveStream = require('../models/LiveStream');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const { protect, merchantOnly, approvedMerchantOnly } = require('../middleware/auth');

const router = express.Router();
const productSubscribers = new Map();

const productForStream = async (stream) => {
  if (!stream?.productId) return null;
  const product = await Product.findOne({
    _id: stream.productId,
    isActive: true,
    status: { $in: ['approved', undefined, null] },
  }).select('nameAr nameEn slug price compareAtPrice images stock isActive status').lean();

  return product ? {
    id: String(product._id),
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: product.images || [],
    stock: product.stock,
  } : null;
};

const writeProductEvent = (res, product) => {
  res.write(`event: product\ndata: ${JSON.stringify({ product })}\n\n`);
};

const publishProduct = (streamId, product) => {
  const subscribers = productSubscribers.get(String(streamId));
  if (!subscribers) return;

  for (const res of subscribers) {
    try {
      writeProductEvent(res, product);
    } catch {
      subscribers.delete(res);
    }
  }
};

router.get('/:streamId/product', async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({ _id: req.params.streamId, status: 'live' }).lean();
    if (!stream) return res.status(404).json({ message: 'البث غير موجود أو انتهى' });
    return res.json({ product: await productForStream(stream) });
  } catch (error) {
    return next(error);
  }
});

router.get('/:streamId/product/events', async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({ _id: req.params.streamId, status: 'live' }).lean();
    if (!stream) return res.status(404).json({ message: 'البث غير موجود أو انتهى' });

    res.status(200);
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    const streamKey = String(stream._id);
    if (!productSubscribers.has(streamKey)) productSubscribers.set(streamKey, new Set());
    const subscribers = productSubscribers.get(streamKey);
    subscribers.add(res);

    writeProductEvent(res, await productForStream(stream));

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    const close = () => {
      clearInterval(heartbeat);
      subscribers.delete(res);
      if (!subscribers.size) productSubscribers.delete(streamKey);
    };

    req.on('close', close);
    return undefined;
  } catch (error) {
    return next(error);
  }
});

router.put('/:streamId/product', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  return merchantOnly(req, res, (err) => {
    if (err) return next(err);
    return approvedMerchantOnly(req, res, next);
  });
}, async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({ _id: req.params.streamId, status: 'live' });
    if (!stream) return res.status(404).json({ message: 'البث غير موجود أو انتهى' });
    if (req.user.role !== 'admin' && String(stream.broadcasterId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'لا تملك صلاحية تعديل هذا البث' });
    }

    const rawProductId = req.body?.productId ?? null;
    if (rawProductId === null || rawProductId === '') {
      stream.productId = null;
      await stream.save();
      publishProduct(stream._id, null);
      return res.json({ product: null });
    }

    if (!mongoose.Types.ObjectId.isValid(rawProductId)) {
      return res.status(400).json({ message: 'معرّف المنتج غير صالح' });
    }

    const product = await Product.findOne({
      _id: rawProductId,
      isActive: true,
      status: { $in: ['approved', undefined, null] },
    });
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود أو غير متاح' });

    if (req.user.role !== 'admin') {
      const merchant = await Merchant.findOne({ user: req.user._id, status: 'approved' }).select('_id').lean();
      if (!merchant || !product.merchant || String(product.merchant) !== String(merchant._id)) {
        return res.status(403).json({ message: 'لا يمكنك ربط منتج لا يخص متجرك' });
      }
    }

    stream.productId = product._id;
    await stream.save();
    const publicProduct = await productForStream(stream);
    publishProduct(stream._id, publicProduct);
    return res.json({ product: publicProduct });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
