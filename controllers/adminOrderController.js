const Order = require('../models/Order');
const MerchantOrderStatus = require('../models/MerchantOrderStatus');
const mongoose = require('mongoose');

const buildMerchantFulfillment = (order, statusByMerchant) => {
  const merchants = new Map();
  for (const item of order.items || []) {
    if (!item.merchant) continue;
    const merchantId = String(item.merchant._id || item.merchant);
    if (!merchants.has(merchantId)) {
      const saved = statusByMerchant.get(merchantId);
      merchants.set(merchantId, {
        merchantId,
        merchantName:
          item.merchant?.storeName ||
          item.merchant?.businessName ||
          item.merchant?.name ||
          item.merchantNameSnapshot ||
          'تاجر',
        status: saved?.status || 'confirmed',
        items: [],
      });
    }
    merchants.get(merchantId).items.push({
      nameSnapshot: item.nameSnapshot,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || {},
      variantId: item.variantId || null,
    });
  }
  const result = Array.from(merchants.values());
  return {
    merchants: result,
    readyMerchants: result.filter((m) => m.status === 'ready').length,
    totalMerchants: result.length,
    allReady: result.length > 0 && result.every((m) => m.status === 'ready'),
  };
};

const allowedPaymentStatuses = new Set(['pending', 'paid', 'failed', 'refunded']);
const allowedPaymentTransitions = {
  pending: new Set(['pending', 'paid', 'failed']),
  paid: new Set(['paid', 'refunded']),
  failed: new Set(['failed', 'pending', 'paid']),
  refunded: new Set(['refunded']),
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
    const filter = includeArchived ? {} : { isArchived: { $ne: true } };

    const orders = await Order.find(filter)
      .select(
        'orderNumber user items customer shippingAddress subtotal discount loyaltyPointsRedeemed loyaltyDiscount shippingFee total totalCommissionAmount totalMerchantAmount paymentMethod vodafoneCashInfo paymentStatus status couponCode placedAt createdAt updatedAt isArchived archivedAt dailyReport'
      )
      .populate('user', 'name email phone')
      .populate('items.product', 'nameAr nameEn images sku')
      .populate('items.merchant', 'name storeName businessName')
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map((order) => order._id);
    const statuses = orderIds.length
      ? await MerchantOrderStatus.find({ order: { $in: orderIds } })
          .select('order merchant status')
          .lean()
      : [];
    const statusMap = new Map();
    for (const row of statuses) {
      const orderKey = String(row.order);
      if (!statusMap.has(orderKey)) statusMap.set(orderKey, new Map());
      statusMap.get(orderKey).set(String(row.merchant), row);
    }

    res.json({
      orders: orders.map((order) => ({
        ...order,
        merchantFulfillment: buildMerchantFulfillment(
          order,
          statusMap.get(String(order._id)) || new Map()
        ),
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePaymentStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params?.id)) {
      return res.status(400).json({ message: 'معرف الطلب غير صالح' });
    }

    const paymentStatus = String(req.body?.paymentStatus || '').trim().toLowerCase();
    if (!allowedPaymentStatuses.has(paymentStatus)) {
      return res.status(400).json({ message: 'حالة الدفع غير صالحة' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

    const currentStatus = String(order.paymentStatus || 'pending');
    if (!allowedPaymentTransitions[currentStatus]?.has(paymentStatus)) {
      return res.status(409).json({ message: `لا يمكن تغيير حالة الدفع من ${currentStatus} إلى ${paymentStatus}` });
    }

    order.paymentStatus = paymentStatus;
    await order.save();
    res.json({ order });
  } catch (error) {
    next(error);
  }
};
