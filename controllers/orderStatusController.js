const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const { releaseCompletedRedemptionForOrder, awardDeliveredOrder } = require('../services/loyaltyService');

const normalizeOptionKey = (name) => {
  const key = String(name || '').trim().toLowerCase();
  if (['color', 'colour', 'اللون', 'لون'].includes(key)) return 'color';
  if (['size', 'المقاس', 'مقاس'].includes(key)) return 'size';
  return key;
};
const getVariantValue = (variant) => variant?.value ?? variant?.label ?? variant?.name ?? '';
const allowedStatuses = new Set(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

exports.updateOrderStatus = async (req, res, next) => {
  const requestedStatus = String(req.body?.status || '');
  if (!allowedStatuses.has(requestedStatus)) return res.status(400).json({ message: 'حالة الطلب غير صالحة' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'معرف الطلب غير صالح' });

  const session = await mongoose.startSession();
  try {
    let updatedOrder;
    let shouldAward = false;
    let shouldRelease = false;

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) { const error = new Error('الطلب غير موجود'); error.statusCode = 404; throw error; }
      if (order.status === requestedStatus) { const error = new Error('الطلب بالفعل على هذه الحالة'); error.statusCode = 409; throw error; }
      if (order.status === 'delivered' && requestedStatus !== 'delivered') { const error = new Error('لا يمكن تغيير حالة طلب تم تسليمه'); error.statusCode = 409; throw error; }
      if (order.status === 'cancelled' && requestedStatus !== 'cancelled') { const error = new Error('لا يمكن إعادة فتح طلب ملغى'); error.statusCode = 409; throw error; }
      if (requestedStatus === 'cancelled' && order.status === 'delivered') { const error = new Error('لا يمكن إلغاء طلب تم تسليمه'); error.statusCode = 409; throw error; }

      if (requestedStatus === 'cancelled') {
        const buckets = new Map();
        const addBucket = (productId, variantId, quantity) => {
          const safeQuantity = Number(quantity || 0);
          if (!safeQuantity) return;
          const key = `${productId}:${variantId || 'default'}`;
          const current = buckets.get(key);
          if (current) current.quantity += safeQuantity;
          else buckets.set(key, { productId, variantId: variantId || null, quantity: safeQuantity });
        };

        for (const item of order.items || []) {
          const quantity = Number(item.quantity || 0);
          if (!quantity) continue;
          const selectedOptions = item.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions) ? item.selectedOptions : {};
          const optionEntries = Object.entries(selectedOptions).filter(([, value]) => value != null && String(value).trim());

          if (optionEntries.length) {
            const product = await Product.findById(item.product).session(session);
            if (!product) { const error = new Error('تعذر العثور على أحد منتجات الطلب لإعادة المخزون'); error.statusCode = 409; throw error; }
            for (const [rawName, rawValue] of optionEntries) {
              const key = normalizeOptionKey(rawName);
              const value = String(rawValue).trim();
              const variant = (product.variants || []).find((candidate) => normalizeOptionKey(candidate?.name) === key && String(getVariantValue(candidate)).trim() === value);
              if (!variant) { const error = new Error(`تعذر تحديد الخيار ${value} لإعادة المخزون`); error.statusCode = 409; throw error; }
              addBucket(item.product, variant._id, quantity);
            }
          } else if (item.variantId) addBucket(item.product, item.variantId, quantity);
          else addBucket(item.product, null, quantity);
        }

        for (const bucket of buckets.values()) {
          const result = bucket.variantId
            ? await Product.updateOne({ _id: bucket.productId, 'variants._id': bucket.variantId }, { $inc: { 'variants.$.stock': bucket.quantity } }, { session })
            : await Product.updateOne({ _id: bucket.productId }, { $inc: { stock: bucket.quantity } }, { session });
          if (!result.matchedCount) { const error = new Error('تعذر إعادة مخزون أحد منتجات الطلب، تم إلغاء العملية بالكامل'); error.statusCode = 409; throw error; }
        }

        const usage = await CouponUsage.findOneAndUpdate({ order: order._id, status: { $in: ['reserved', 'consumed'] } }, { $set: { status: 'released' } }, { new: true, session });
        if (usage) await Coupon.updateOne({ _id: usage.coupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, { session });
        else if (order.couponCode) await Coupon.updateOne({ code: String(order.couponCode).trim().toUpperCase(), usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, { session });

        order.status = 'cancelled';
        if (order.paymentStatus === 'pending') order.paymentStatus = 'failed';
        await order.save({ session, validateModifiedOnly: true });
        shouldRelease = Number(order.loyaltyPointsRedeemed || 0) > 0;
      } else {
        order.status = requestedStatus;
        if (requestedStatus === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
        await order.save({ session, validateModifiedOnly: true });
        shouldAward = requestedStatus === 'delivered';
      }
      updatedOrder = order;
    });

    if (shouldRelease) await releaseCompletedRedemptionForOrder(updatedOrder._id);
    if (shouldAward) {
      const awarded = await awardDeliveredOrder(updatedOrder);
      updatedOrder = await Order.findById(updatedOrder._id);
      return res.json({ order: updatedOrder, loyaltyPointsAwarded: awarded });
    }
    return res.json({ order: updatedOrder });
  } catch (err) {
    if (err?.statusCode) return res.status(err.statusCode).json({ message: err.message });
    return next(err);
  } finally {
    await session.endSession();
  }
};
