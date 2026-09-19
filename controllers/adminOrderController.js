const Order = require('../models/Order');
const MerchantOrderStatus = require('../models/MerchantOrderStatus');
const mongoose = require('mongoose');

const PAGE_DEFAULT = 25;
const PAGE_MAX = 50;
const allowedStatuses = new Set(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

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

const escapeRegex = (value) => String(value).replace(/[\^$.*+?()[\]{}|]/g, '\\$&');

exports.getAllOrders = async (req, res, next) => {
  try {
    const requestedPage = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(PAGE_MAX, Math.max(1, Number(req.query?.limit) || PAGE_DEFAULT));
    const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
    const status = String(req.query?.status || '').trim().toLowerCase();
    const sortDirection = String(req.query?.sort || 'newest').trim().toLowerCase() === 'oldest' ? 1 : -1;
    const query = String(req.query?.q || '').trim();
    const compact = String(req.query?.compact || '').toLowerCase() === 'true';

    const baseFilter = includeArchived ? {} : { isArchived: { $ne: true } };
    const filter = { ...baseFilter };
    if (allowedStatuses.has(status)) filter.status = status;
    if (query) {
      const regex = new RegExp(escapeRegex(query), 'i');
      filter.$or = [
        { orderNumber: regex },
        { 'customer.name': regex },
        { 'customer.phone': regex },
        { 'customer.email': regex },
      ];
    }

    const projection = compact
      ? 'orderNumber items customer total status createdAt'
      : 'orderNumber user items customer shippingAddress subtotal discount loyaltyPointsRedeemed loyaltyDiscount shippingFee total totalCommissionAmount totalMerchantAmount paymentMethod vodafoneCashInfo paymentStatus status couponCode placedAt createdAt updatedAt isArchived archivedAt dailyReport';
    const orderQuery = Order.find(filter)
      .select(projection)
      .sort({ createdAt: sortDirection, _id: sortDirection })
      .skip((requestedPage - 1) * limit)
      .limit(limit);
    if (!compact) {
      orderQuery
        .populate('user', 'name email phone')
        .populate('items.product', 'nameAr nameEn images sku')
        .populate('items.merchant', 'name storeName businessName');
    }

    const [orders, total, statusRows] = await Promise.all([
      orderQuery.lean(),
      compact ? Promise.resolve(0) : Order.countDocuments(filter),
      compact
        ? Promise.resolve([])
        : Order.aggregate([
            { $match: baseFilter },
            {
              $group: {
                _id: null,
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
                shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                paymentAttentionCount: {
                  $sum: {
                    $cond: [
                      { $and: [{ $eq: ['$paymentMethod', 'vodafone_cash'] }, { $ne: ['$paymentStatus', 'paid'] }] },
                      1,
                      0,
                    ],
                  },
                },
                attentionCount: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $in: ['$status', ['pending', 'processing', 'shipped']] },
                          { $and: [{ $eq: ['$paymentMethod', 'vodafone_cash'] }, { $ne: ['$paymentStatus', 'paid'] }] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ]),
    ]);

    const orderIds = orders.map((order) => order._id);
    const statuses = !compact && orderIds.length
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

    const meta = statusRows?.[0] || {};
    const pages = Math.ceil(Number(total || 0) / limit);

    res.json({
      orders: compact ? orders : orders.map((order) => ({
        ...order,
        merchantFulfillment: buildMerchantFulfillment(
          order,
          statusMap.get(String(order._id)) || new Map()
        ),
      })),
      total: Number(total || 0),
      page: requestedPage,
      limit,
      pages,
      statusCounts: {
        pending: Number(meta.pending || 0),
        confirmed: Number(meta.confirmed || 0),
        processing: Number(meta.processing || 0),
        shipped: Number(meta.shipped || 0),
        delivered: Number(meta.delivered || 0),
        cancelled: Number(meta.cancelled || 0),
      },
      paymentAttentionCount: Number(meta.paymentAttentionCount || 0),
      attentionCount: Number(meta.attentionCount || 0),
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
      return res.status(409).json({ message: 'لا يمكن تغيير حالة الدفع من ' + currentStatus + ' إلى ' + paymentStatus });
    }

    order.paymentStatus = paymentStatus;
    await order.save();
    res.json({ order });
  } catch (error) {
    next(error);
  }
};
