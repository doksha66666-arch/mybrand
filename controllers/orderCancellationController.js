const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const { releaseCompletedRedemptionForOrder } = require('../services/loyaltyService');

const normalizeOptionKey = (name) => {
  const key = String(name || '').trim().toLowerCase();
  if (['color', 'colour', 'اللون', 'لون'].includes(key)) return 'color';
  if (['size', 'المقاس', 'مقاس'].includes(key)) return 'size';
  return key;
};

const getVariantValue = (variant) => variant?.value ?? variant?.label ?? variant?.name ?? '';

const addStockBucket = (buckets, productId, variantId, quantity) => {
  const safeQuantity = Number(quantity || 0);
  if (!safeQuantity) return;
  const key = `${productId}:${variantId || 'default'}`;
  const existing = buckets.get(key);
  if (existing) existing.quantity += safeQuantity;
  else buckets.set(key, { productId, variantId: variantId || null, quantity: safeQuantity });
};

exports.cancelOrder = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'معرف الطلب غير صالح' });

  const session = await mongoose.startSession();
  try {
    let cancelledOrder;
    let shouldReleaseLoyalty = false;

    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).session(session);
      if (!order) {
        const error = new Error('الطلب غير موجود');
        error.statusCode = 404;
        throw error;
      }
      if (!['pending', 'confirmed'].includes(order.status)) {
        const error = new Error('لا يمكن إلغاء الطلب في حالته الحالية');
        error.statusCode = 409;
        throw error;
      }

      const buckets = new Map();
      for (const item of order.items || []) {
        const quantity = Number(item.quantity || 0);
        if (!quantity) continue;

        const selectedOptions = item.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions)
          ? item.selectedOptions
          : {};
        const optionEntries = Object.entries(selectedOptions).filter(([, value]) => value != null && String(value).trim());

        if (optionEntries.length) {
          const product = await Product.findById(item.product).session(session);
          if (!product) {
            const error = new Error('تعذر العثور على أحد منتجات الطلب لإعادة المخزون');
            error.statusCode = 409;
            throw error;
          }

          for (const [rawName, rawValue] of optionEntries) {
            const key = normalizeOptionKey(rawName);
            const value = String(rawValue).trim();
            const variant = (product.variants || []).find(
              (candidate) => normalizeOptionKey(candidate?.name) === key && String(getVariantValue(candidate)).trim() === value
            );
            if (!variant) {
              const error = new Error(`تعذر تحديد الخيار ${value} لإعادة المخزون`);
              error.statusCode = 409;
              throw error;
            }
            addStockBucket(buckets, item.product, variant._id, quantity);
          }
        } else if (item.variantId) {
          addStockBucket(buckets, item.product, item.variantId, quantity);
        } else {
          addStockBucket(buckets, item.product, null, quantity);
        }
      }

      for (const bucket of buckets.values()) {
        const result = bucket.variantId
          ? await Product.findOneAndUpdate(
              { _id: bucket.productId, 'variants._id': bucket.variantId },
              { $inc: { 'variants.$.stock': bucket.quantity } },
              { new: true, session }
            )
          : await Product.findOneAndUpdate(
              { _id: bucket.productId },
              { $inc: { stock: bucket.quantity } },
              { new: true, session }
            );
        if (!result) {
          const error = new Error('تعذر إعادة مخزون أحد منتجات الطلب، تم إلغاء العملية بالكامل');
          error.statusCode = 409;
          throw error;
        }
      }

      const usage = await CouponUsage.findOneAndUpdate(
        { order: order._id, status: { $in: ['reserved', 'consumed'] } },
        { $set: { status: 'released' } },
        { new: true, session }
      );
      if (usage) {
        await Coupon.updateOne(
          { _id: usage.coupon, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } },
          { session }
        );
      } else if (order.couponCode) {
        await Coupon.updateOne(
          { code: String(order.couponCode).trim().toUpperCase(), usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } },
          { session }
        );
      }

      order.status = 'cancelled';
      if (order.paymentStatus === 'pending') order.paymentStatus = 'failed';
      await order.save({ session, validateModifiedOnly: true });
      cancelledOrder = order;
      shouldReleaseLoyalty = Number(order.loyaltyPointsRedeemed || 0) > 0;
    });

    if (shouldReleaseLoyalty) {
      await releaseCompletedRedemptionForOrder(cancelledOrder._id);
    }

    return res.json({ order: cancelledOrder });
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ message: error.message });
    return next(error);
  } finally {
    await session.endSession();
  }
};
