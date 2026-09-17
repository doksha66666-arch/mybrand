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

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getAllOrders = async (req, res, next) => {
  try {
    const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
    const status = String(req.query?.status || '').trim().toLowerCase();
    const search = String(req.query?.search || '').trim();
    const sort = String(req.query?.sort || 'newest').toLowerCase() === 'oldest' ? 1 : -1;
    const hasPagination = req.query?.page != null || req.query?.limit != null;
    const page = Math.max(1, Number.parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query?.limit, 10) || 50));

    const filter = includeArchived ? {} : { isArchived: { $ne: true } };
    if (status) filter.status = status;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { orderNumber: pattern },
        { 'customer.name': pattern },
        { 'customer.phone': pattern },
        { 'customer.email': pattern },
      ];
    }

    const baseQuery = Order.find(filter)
      .select(
        'orderNumber user items customer shippingAddress subtotal discount loyaltyPointsRedeemed loyaltyDiscount shippingFee total totalCommissionAmount totalMerchantAmount paymentMethod vodafoneCashInfo paymentStatus status couponCode placedAt createdAt updatedAt isArchived archivedAt dailyReport'
      )
      .populate('user', 'name email phone')
      .populate('items.product', 'nameAr nameEn images sku')
      .populate('items.merchant', 'name storeName businessName')
      .sort({ createdAt: sort });

    if (hasPagination) baseQuery.skip((page - 1) * limit).limit(limit);

    const [orders, total] = await Promise.all([
      baseQuery.lean(),
      hasPagination ? Order.countDocuments(filter) : Promise.resolve(null),
    ]);

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

    const payload = orders.map((order) => ({
      ...order,
      merchantFulfillment: buildMerchantFulfillment(
        order,
        statusMap.get(String(order._id)) || new Map()
      ),
    }));

    if (!hasPagination) return res.json({ orders: payload });

    res.json({
      orders: payload,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
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
