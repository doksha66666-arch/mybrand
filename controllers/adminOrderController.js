const Order = require('../models/Order');
const MerchantOrderStatus = require('../models/MerchantOrderStatus');

const buildMerchantFulfillment = (order, statusByMerchant) => {
  const merchants = new Map();
  for (const item of order.items || []) {
    if (!item.merchant) continue;
    const merchantId = String(item.merchant._id || item.merchant);
    if (!merchants.has(merchantId)) {
      const saved = statusByMerchant.get(merchantId);
      merchants.set(merchantId, {
        merchantId,
        merchantName: item.merchant?.storeName || item.merchant?.name || 'تاجر',
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

exports.getAllOrders = async (req, res, next) => {
  try {
    const includeArchived = String(req.query?.includeArchived || '').toLowerCase() === 'true';
    const orders = await Order.find(includeArchived ? {} : { isArchived: { $ne: true } })
      .populate('user', 'name email phone')
      .populate('items.product', 'nameAr nameEn images sku variants')
      .populate('items.merchant', 'name storeName')
      .sort('-createdAt');

    const orderIds = orders.map((order) => order._id);
    const statuses = orderIds.length
      ? await MerchantOrderStatus.find({ order: { $in: orderIds } }).lean()
      : [];
    const statusMap = new Map();
    for (const row of statuses) {
      const orderKey = String(row.order);
      if (!statusMap.has(orderKey)) statusMap.set(orderKey, new Map());
      statusMap.get(orderKey).set(String(row.merchant), row);
    }

    res.json({
      orders: orders.map((order) => ({
        ...order.toObject(),
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
    const allowed = ['pending', 'paid', 'failed', 'refunded'];
    const paymentStatus = String(req.body?.paymentStatus || '').trim().toLowerCase();
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: 'حالة الدفع غير صالحة' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true, runValidators: true }
    );

    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });
    res.json({ order });
  } catch (error) {
    next(error);
  }
};
