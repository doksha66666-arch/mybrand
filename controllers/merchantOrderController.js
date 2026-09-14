const mongoose = require('mongoose');
const Order = require('../models/Order');
const MerchantOrderStatus = require('../models/MerchantOrderStatus');

const allowed = ['confirmed', 'packed', 'ready'];

const normalizeOptionName = (name) => String(name || '').trim().toLowerCase();
const getOption = (options, names) => Object.entries(options || {}).find(([name]) => names.includes(normalizeOptionName(name)))?.[1] || '';

const fulfillmentItem = (item) => {
  const product = item?.product && typeof item.product === 'object' ? item.product : null;
  const variant = product?.variants?.find((v) => String(v?._id) === String(item?.variantId)) || null;
  const options = item?.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions) ? item.selectedOptions : {};

  let color = getOption(options, ['color', 'colour', 'اللون', 'لون']);
  let size = getOption(options, ['size', 'المقاس', 'مقاس']);

  // Older orders may contain only variantId without selectedOptions.
  if (variant) {
    const variantName = normalizeOptionName(variant.name || variant.optionName);
    const variantValue = variant.value ?? variant.label ?? '';
    if (!color && ['color', 'colour', 'اللون', 'لون'].includes(variantName)) color = String(variantValue || '');
    if (!size && ['size', 'المقاس', 'مقاس'].includes(variantName)) size = String(variantValue || '');
  }

  return {
    name: item?.nameSnapshot || product?.nameAr || 'منتج',
    image: item?.imageSnapshot || variant?.image || product?.images?.[0] || '',
    color: String(color || ''),
    size: String(size || ''),
    options,
    variant: variant ? {
      name: String(variant.name || ''),
      value: String(variant.value ?? variant.label ?? ''),
      sku: String(variant.sku || ''),
      image: String(variant.image || ''),
    } : null,
    quantity: Number(item?.quantity || 0),
    productCode: item?.productCodeSnapshot || variant?.sku || product?.sku || '',
    notes: item?.notesSnapshot || '',
  };
};

const merchantItems = (order, merchantId) => (order.items || [])
  .filter((item) => String(item.merchant) === String(merchantId))
  .map(fulfillmentItem);

exports.getMerchantFulfillmentOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
      'items.merchant': req.merchant._id,
    })
      .populate({ path: 'items.product', select: 'nameAr images sku variants' })
      .sort('-createdAt')
      .lean();

    const ids = orders.map((o) => o._id);
    const statuses = await MerchantOrderStatus.find({ merchant: req.merchant._id, order: { $in: ids } }).lean();
    const byOrder = new Map(statuses.map((s) => [String(s.order), s.status]));

    const result = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      merchantStatus: byOrder.get(String(order._id)) || 'confirmed',
      createdAt: order.createdAt,
      items: merchantItems(order, req.merchant._id),
    }));

    res.json({ orders: result });
  } catch (error) { next(error); }
};

exports.updateMerchantFulfillmentStatus = async (req, res, next) => {
  try {
    const status = String(req.body?.merchantStatus || '').trim().toLowerCase();
    if (!allowed.includes(status)) return res.status(400).json({ message: 'حالة التجهيز غير صالحة' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'معرف الطلب غير صالح' });

    const order = await Order.findOne({ _id: req.params.id, 'items.merchant': req.merchant._id, status: { $nin: ['pending', 'cancelled'] } }).select('_id orderNumber status items');
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود أو لا يحتوي على منتج من متجرك' });

    const current = await MerchantOrderStatus.findOne({ order: order._id, merchant: req.merchant._id });
    const currentStatus = current?.status || 'confirmed';
    if (allowed.indexOf(status) < allowed.indexOf(currentStatus)) return res.status(409).json({ message: 'لا يمكن الرجوع إلى مرحلة سابقة' });

    const saved = await MerchantOrderStatus.findOneAndUpdate(
      { order: order._id, merchant: req.merchant._id },
      { $set: { status } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ orderId: order._id, orderNumber: order.orderNumber, merchantStatus: saved.status });
  } catch (error) { next(error); }
};
