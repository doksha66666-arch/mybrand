const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const MerchantOrderStatus = require('../models/MerchantOrderStatus');

const allowed = ['confirmed', 'packed', 'ready'];
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

const normalizeOptionName = (name) => String(name || '').trim().toLowerCase();
const getOption = (options, names) => Object.entries(options || {}).find(([name]) => names.includes(normalizeOptionName(name)))?.[1] || '';
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const fulfillmentItem = (item, productById) => {
  const productId = item?.product?._id || item?.product;
  const product = productById.get(String(productId)) || null;
  const variant = product?.variants?.find((v) => String(v?._id) === String(item?.variantId)) || null;
  const options = item?.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions) ? item.selectedOptions : {};

  let color = getOption(options, ['color', 'colour', 'اللون', 'لون']);
  let size = getOption(options, ['size', 'المقاس', 'مقاس']);

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

const merchantItems = (order, merchantId, productById) => (order.items || [])
  .filter((item) => String(item.merchant) === String(merchantId))
  .map((item) => fulfillmentItem(item, productById));

const parsePagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query?.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(req.query?.limit, 10) || DEFAULT_PAGE_SIZE));
  return { page, limit };
};

exports.getMerchantFulfillmentOrders = async (req, res, next) => {
  try {
    const merchantId = req.merchant._id;
    const { page, limit } = parsePagination(req);
    const stage = String(req.query?.stage || '').trim().toLowerCase();
    const search = String(req.query?.search || '').trim();
    const baseFilter = {
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
      'items.merchant': merchantId,
    };

    const filter = { ...baseFilter };

    if (allowed.includes(stage) && stage !== 'confirmed') {
      const stageOrderIds = await MerchantOrderStatus.find({ merchant: merchantId, status: stage }).distinct('order');
      filter._id = { $in: stageOrderIds };
    } else if (stage === 'confirmed') {
      const advancedOrderIds = await MerchantOrderStatus.find({ merchant: merchantId, status: { $in: ['packed', 'ready'] } }).distinct('order');
      if (advancedOrderIds.length) filter._id = { $nin: advancedOrderIds };
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { orderNumber: pattern },
        { items: { $elemMatch: { merchant: merchantId, nameSnapshot: pattern } } },
        { items: { $elemMatch: { merchant: merchantId, productCodeSnapshot: pattern } } },
      ];
    }

    const statusCountPipeline = [
      { $match: baseFilter },
      { $project: { _id: 1 } },
      {
        $lookup: {
          from: 'merchantorderstatuses',
          let: { orderId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$order', '$$orderId'] }, { $eq: ['$merchant', merchantId] }] } } },
            { $project: { _id: 0, status: 1 } },
          ],
          as: 'merchantStatus',
        },
      },
      { $addFields: { merchantStatus: { $ifNull: [{ $arrayElemAt: ['$merchantStatus.status', 0] }, 'confirmed'] } } },
      { $group: { _id: '$merchantStatus', count: { $sum: 1 } } },
    ];

    const fulfillmentFields = [
      'orderNumber',
      'createdAt',
      'items.product',
      'items.nameSnapshot',
      'items.variantId',
      'items.selectedOptions',
      'items.quantity',
      'items.merchant',
      'items.imageSnapshot',
      'items.productCodeSnapshot',
      'items.notesSnapshot',
    ].join(' ');

    const [orders, total, statusRows] = await Promise.all([
      Order.find(filter)
        .select(fulfillmentFields)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
      MerchantOrderStatus.aggregate(statusCountPipeline),
    ]);

    const orderIds = orders.map((o) => o._id);
    const merchantProductIds = new Set();
    const variantProductIds = new Set();

    for (const order of orders) {
      for (const item of order.items || []) {
        if (String(item.merchant) !== String(merchantId)) continue;
        const productId = item.product?._id || item.product;
        if (!productId) continue;
        const key = String(productId);

        if (!item.nameSnapshot || !item.imageSnapshot || !item.productCodeSnapshot) merchantProductIds.add(key);

        if (item.variantId) {
          const options = item.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions)
            ? item.selectedOptions
            : {};
          const hasColor = Boolean(getOption(options, ['color', 'colour', 'اللون', 'لون']));
          const hasSize = Boolean(getOption(options, ['size', 'المقاس', 'مقاس']));
          if (!hasColor || !hasSize || !item.imageSnapshot || !item.productCodeSnapshot) variantProductIds.add(key);
        }
      }
    }

    const [statuses, baseProducts, variantProducts] = await Promise.all([
      orderIds.length
        ? MerchantOrderStatus.find({ merchant: merchantId, order: { $in: orderIds } }).select('order status').lean()
        : [],
      merchantProductIds.size
        ? Product.find({ _id: { $in: Array.from(merchantProductIds) } }).select('nameAr images sku').lean()
        : [],
      variantProductIds.size
        ? Product.find({ _id: { $in: Array.from(variantProductIds) } }).select('variants.name variants.value variants.label variants.sku variants.image').lean()
        : [],
    ]);

    const byOrder = new Map(statuses.map((s) => [String(s.order), s.status]));
    const productById = new Map(baseProducts.map((product) => [String(product._id), product]));
    for (const product of variantProducts) {
      const existing = productById.get(String(product._id));
      if (existing) existing.variants = product.variants || [];
      else productById.set(String(product._id), product);
    }

    const result = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      merchantStatus: byOrder.get(String(order._id)) || 'confirmed',
      createdAt: order.createdAt,
      items: merchantItems(order, merchantId, productById),
    }));

    const rawStatusCounts = Object.fromEntries(statusRows.map((row) => [row._id, Number(row.count || 0)]));
    const statusCounts = {
      confirmed: rawStatusCounts.confirmed || 0,
      packed: rawStatusCounts.packed || 0,
      ready: rawStatusCounts.ready || 0,
    };

    const totalPages = Math.ceil(total / limit);
    res.json({
      orders: result,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      counts: statusCounts,
    });
  } catch (error) {
    next(error);
  }
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
