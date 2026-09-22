const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const Coupon = require('../models/Coupon');
const PaymentMethod = require('../models/PaymentMethod');
const PaymentSettings = require('../models/PaymentSettings');

const generateOrderNumber = () => {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `MB-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const sanitizeCustomerOrder = (order) => {
  const scoped = order.toObject ? order.toObject() : { ...order };
  scoped.items = (scoped.items || []).map((item) => {
    const clean = { ...item };
    delete clean.merchant; delete clean.commissionRate; delete clean.commissionAmount; delete clean.merchantAmount;
    return clean;
  });
  delete scoped.totalCommissionAmount; delete scoped.totalMerchantAmount;
  return scoped;
};

const getCouponStatus = (coupon) => {
  const now = new Date();
  if (!coupon || !coupon.isActive) return 'inactive';
  if (!(coupon.startDate instanceof Date) || Number.isNaN(coupon.startDate.getTime())) return 'invalid';
  if (!(coupon.endDate instanceof Date) || Number.isNaN(coupon.endDate.getTime())) return 'invalid';
  if (coupon.startDate > now) return 'not_started';
  if (coupon.endDate < now) return 'expired';
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return 'limit_reached';
  return 'active';
};

const calculateCouponDiscount = (coupon, amount) => {
  if (amount < Number(coupon.minOrderAmount || 0)) return 0;
  let discount = coupon.discountType === 'percentage'
    ? amount * Number(coupon.discountValue || 0) / 100
    : Number(coupon.discountValue || 0);
  if (coupon.maxDiscountAmount != null) discount = Math.min(discount, Number(coupon.maxDiscountAmount));
  return Math.min(Math.max(0, discount), amount);
};

const normalizeOptionKey = (name) => {
  const key = String(name || '').trim().toLowerCase();
  if (['color', 'colour', 'اللون', 'لون'].includes(key)) return 'color';
  if (['size', 'المقاس', 'مقاس'].includes(key)) return 'size';
  return key;
};
const getVariantValue = (variant) => variant?.value ?? variant?.label ?? variant?.name ?? '';
const normalizeSelectedOptions = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value).reduce((out, [name, optionValue]) => {
    if (optionValue != null && String(optionValue).trim()) out[normalizeOptionKey(name)] = String(optionValue).trim();
    return out;
  }, {});
};

const checkoutPaymentMethodKeys = { cod: 'cod', card: 'cards', wallet: 'instapay', vodafone_cash: 'vodafone' };
const isCheckoutPaymentMethodReady = (method) => (
  Boolean(method?.isActive) &&
  (method.type === 'cod' || (method.type === 'manual_transfer' && String(method.displayValue || '').trim()))
);

exports.createOrder = async (req, res, next) => {
  const reservations = [];
  let couponReserved = null;
  const rollbackReservations = async () => {
    for (const r of reservations.reverse()) {
      try {
        if (r.variantId) await Product.updateOne({ _id: r.productId, 'variants._id': r.variantId }, { $inc: { 'variants.$.stock': r.quantity } });
        else await Product.updateOne({ _id: r.productId }, { $inc: { stock: r.quantity } });
      } catch (e) { console.error('Failed to rollback stock reservation:', e); }
    }
  };
  const rollbackCoupon = async () => {
    if (!couponReserved) return;
    try { await Coupon.updateOne({ _id: couponReserved }, { $inc: { usedCount: -1 } }); } catch (e) { console.error('Failed to rollback coupon usage:', e); }
    couponReserved = null;
  };
  try {
    const { items: rawItems, shippingAddress, customer, paymentMethod = 'cod', vodafoneCashInfo, couponCode, shippingMethod = 'standard' } = req.body;
    const allowedPaymentMethods = ['cod', 'card', 'wallet', 'vodafone_cash'];
    if (!allowedPaymentMethods.includes(paymentMethod)) return res.status(400).json({ message: 'طريقة دفع غير صالحة' });

    const configuredPaymentKey = checkoutPaymentMethodKeys[paymentMethod];
    const configuredPaymentMethod = await PaymentMethod.findOne({ key: configuredPaymentKey }).lean();
    // COD remains available on a fresh database before payment settings are initialized.
    if (configuredPaymentMethod && !isCheckoutPaymentMethodReady(configuredPaymentMethod)) {
      return res.status(409).json({ message: 'طريقة الدفع المحددة غير متاحة حاليًا' });
    }
    if (!configuredPaymentMethod && paymentMethod !== 'cod') {
      return res.status(409).json({ message: 'طريقة الدفع المحددة غير متاحة حاليًا' });
    }
    if (!['standard', 'express'].includes(shippingMethod)) return res.status(400).json({ message: 'طريقة الشحن غير صالحة' });
    if (!Array.isArray(rawItems) || rawItems.length === 0) return res.status(400).json({ message: 'السلة فارغة' });
    if (!shippingAddress?.city || !shippingAddress?.street) return res.status(400).json({ message: 'يرجى إدخال المدينة والعنوان' });
    if (paymentMethod === 'vodafone_cash' && !vodafoneCashInfo?.senderPhone) return res.status(400).json({ message: 'يرجى إدخال رقم الهاتف الذي تم التحويل منه' });

    const productCache = new Map(); const stockBuckets = new Map(); const items = [];
    for (const raw of rawItems) {
      if (!raw?.productId || !mongoose.isValidObjectId(raw.productId)) return res.status(400).json({ message: 'يوجد منتج بمعرف غير صالح في السلة' });
      const quantity = Number(raw.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return res.status(400).json({ message: 'الكمية يجب أن تكون رقمًا صحيحًا بين 1 و1000' });
      let product = productCache.get(String(raw.productId));
      if (!product) { product = await Product.findById(raw.productId).populate('merchant', 'status commissionRate'); productCache.set(String(raw.productId), product); }
      const isApproved = !product?.status || product.status === 'approved';
      const merchantApproved = !product?.merchant || product.merchant.status === 'approved';
      if (!product || !product.isActive || !isApproved || !merchantApproved) return res.status(400).json({ message: 'أحد المنتجات في السلة لم يعد متاحًا' });

      const selectedOptions = normalizeSelectedOptions(raw.selectedOptions);
      const selectedVariants = [];
      for (const [key, value] of Object.entries(selectedOptions)) {
        const found = product.variants.find((v) => normalizeOptionKey(v?.name) === key && String(getVariantValue(v)).trim() === value);
        if (!found) return res.status(400).json({ message: `الاختيار "${value}" للمنتج "${product.nameAr}" غير موجود` });
        if (Number(found.stock ?? 0) < quantity) return res.status(409).json({ message: `المخزون غير كافٍ للاختيار "${value}" في المنتج "${product.nameAr}"` });
        selectedVariants.push(found);
      }

      let explicitVariant = null;
      if (raw.variantId) {
        if (!mongoose.isValidObjectId(raw.variantId)) return res.status(400).json({ message: 'الاختيار الموجود في السلة غير صالح' });
        explicitVariant = product.variants.id(raw.variantId);
        if (!explicitVariant) return res.status(400).json({ message: `الخيار المحدد للمنتج "${product.nameAr}" غير موجود` });
      }
      if (!selectedVariants.length && explicitVariant) selectedVariants.push(explicitVariant);
      if (explicitVariant && selectedVariants.length && !selectedVariants.some((v) => String(v._id) === String(explicitVariant._id))) {
        return res.status(400).json({ message: `الاختيار الموجود في السلة لا يطابق خيارات المنتج "${product.nameAr}"` });
      }
      if (!selectedVariants.length && !explicitVariant && Number(product.stock ?? 0) < quantity) return res.status(409).json({ message: `المخزون غير كافٍ للمنتج "${product.nameAr}"` });

      const modifier = selectedVariants.reduce((sum, v) => sum + Number(v?.priceModifier || 0), 0);
      const unitPrice = Number(product.price) + modifier;
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return res.status(400).json({ message: 'سعر المنتج غير صالح' });
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      let commissionRate = 0; let merchantId = null;
      if (product.merchant) { merchantId = product.merchant._id; commissionRate = typeof product.commissionRateOverride === 'number' ? product.commissionRateOverride : Number(product.merchant.commissionRate || 0); }
      const commissionAmount = Math.round(lineTotal * commissionRate) / 100;
      const merchantAmount = Math.round((lineTotal - commissionAmount) * 100) / 100;
      const imageSnapshot = selectedVariants.find((variant) => variant?.image)?.image || product.images?.[0] || '';
      const productCodeSnapshot = selectedVariants.find((variant) => variant?.sku)?.sku || product.sku || '';
      const notesSnapshot = raw.notes != null ? String(raw.notes).trim() : '';
      items.push({ product: product._id, nameSnapshot: product.nameAr, variantId: explicitVariant?._id || selectedVariants[0]?._id || null, selectedOptions, quantity, unitPrice, lineTotal, merchant: merchantId, commissionRate, commissionAmount, merchantAmount, imageSnapshot, productCodeSnapshot, notesSnapshot });

      if (selectedVariants.length) {
        for (const selectedVariant of selectedVariants) {
          const bucketId = `${product._id}:${selectedVariant._id}`;
          const bucket = stockBuckets.get(bucketId);
          if (bucket) bucket.quantity += quantity;
          else stockBuckets.set(bucketId, { productId: product._id, variantId: selectedVariant._id, quantity, expectedPrice: product.price, expectedVariantPriceModifier: Number(selectedVariant?.priceModifier || 0) });
        }
      } else {
        const bucketId = `${product._id}:default`;
        const bucket = stockBuckets.get(bucketId);
        if (bucket) bucket.quantity += quantity;
        else stockBuckets.set(bucketId, { productId: product._id, variantId: null, quantity, expectedPrice: product.price, expectedVariantPriceModifier: 0 });
      }
    }

    const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
    let discount = 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const normalizedCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalizedCode });
      const couponStatus = getCouponStatus(coupon);
      if (couponStatus !== 'active') return res.status(400).json({ message: couponStatus === 'expired' ? 'انتهت صلاحية القسيمة' : couponStatus === 'limit_reached' ? 'تم الوصول إلى حد استخدام القسيمة' : 'القسيمة غير صالحة' });
      if (coupon.assignedTo.length && !coupon.assignedTo.some((id) => String(id) === String(req.user._id))) return res.status(403).json({ message: 'هذه القسيمة مخصصة لحساب آخر' });
      discount = calculateCouponDiscount(coupon, subtotal);
      if (!discount) return res.status(400).json({ message: `الحد الأدنى للطلب ${coupon.minOrderAmount} ج.م` });
      const reservedCoupon = await Coupon.findOneAndUpdate({ _id: coupon._id, isActive: true, $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }, { $inc: { usedCount: 1 } }, { new: true });
      if (!reservedCoupon) return res.status(409).json({ message: 'تم الوصول إلى حد استخدام القسيمة، يرجى المحاولة بقسيمة أخرى' });
      couponReserved = reservedCoupon._id;
      appliedCouponCode = reservedCoupon.code;
    }
    discount = Math.min(Math.max(0, discount), subtotal);
    const shippingFee = shippingMethod === 'express' ? 45 : 0;
    const total = Math.max(0, Math.round((subtotal - discount + shippingFee) * 100) / 100);

    if (paymentMethod === 'cod') {
      const paymentSettings = await PaymentSettings.findOne({ key: 'global' }).lean();
      if (paymentSettings?.codLimitEnabled) {
        const rawLimit = String(paymentSettings.codLimit ?? '').replace(/,/g, '').trim();
        const codLimit = Number(rawLimit);
        if (Number.isFinite(codLimit) && codLimit > 0 && total > codLimit) {
          await rollbackCoupon();
          return res.status(409).json({ message: `الحد الأقصى للدفع عند الاستلام هو ${codLimit} ج.م` });
        }
      }
    }

    const totalCommissionAmount = Math.round(items.reduce((s, i) => s + i.commissionAmount, 0) * 100) / 100;
    const totalMerchantAmount = Math.round(items.reduce((s, i) => s + i.merchantAmount, 0) * 100) / 100;

    for (const bucket of stockBuckets.values()) {
      const approvedQuery = { _id: bucket.productId, isActive: true, $or: [{ status: 'approved' }, { status: { $exists: false } }] };
      let updated;
      if (bucket.variantId) updated = await Product.findOneAndUpdate({ ...approvedQuery, variants: { $elemMatch: { _id: bucket.variantId, stock: { $gte: bucket.quantity }, priceModifier: bucket.expectedVariantPriceModifier } }, price: bucket.expectedPrice }, { $inc: { 'variants.$.stock': -bucket.quantity } }, { new: true });
      else updated = await Product.findOneAndUpdate({ ...approvedQuery, stock: { $gte: bucket.quantity }, price: bucket.expectedPrice }, { $inc: { stock: -bucket.quantity } }, { new: true });
      if (!updated) { await rollbackReservations(); await rollbackCoupon(); return res.status(409).json({ message: 'المخزون أو سعر أحد المنتجات تغيّر، يرجى مراجعة السلة والمحاولة مرة أخرى' }); }
      reservations.push(bucket);
    }

    const orderPayload = {
      user: req.user._id,
      items,
      customer: { name: customer?.name || req.user.name, email: req.user.email, phone: customer?.phone || req.user.phone },
      shippingAddress: { country: shippingAddress.country || '', city: shippingAddress.city, street: shippingAddress.street, building: shippingAddress.building || '', notes: shippingAddress.notes || '' },
      subtotal,
      discount,
      shippingFee,
      total,
      totalCommissionAmount,
      totalMerchantAmount,
      paymentMethod,
      paymentStatus: 'pending',
      couponCode: appliedCouponCode || undefined,
      vodafoneCashInfo: paymentMethod === 'vodafone_cash' ? { senderPhone: String(vodafoneCashInfo.senderPhone).trim(), transactionRef: String(vodafoneCashInfo.transactionRef || '').trim() } : undefined,
      status: 'pending',
    };

    let order;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        order = await Order.create({ ...orderPayload, orderNumber: generateOrderNumber() });
        break;
      } catch (err) {
        const duplicateOrderNumber = err?.code === 11000 && (err?.keyPattern?.orderNumber || err?.keyValue?.orderNumber);
        if (!duplicateOrderNumber || attempt === 4) throw err;
      }
    }

    couponReserved = null;
    res.status(201).json({ order });
  } catch (err) { await rollbackReservations(); await rollbackCoupon(); next(err); }
};

exports.getMyOrders = async (req, res, next) => { try { const orders = await Order.find({ user: req.user._id }).sort('-createdAt'); res.json({ orders: orders.map(sanitizeCustomerOrder) }); } catch (err) { next(err); } };
exports.getMerchantOrders = async (req, res, next) => { try { const orders = await Order.find({ 'items.merchant': req.merchant._id }).populate('user', 'name email phone').sort('-createdAt'); const scoped = orders.map((order) => { const myItems = order.items.filter((i) => i.merchant && i.merchant.toString() === req.merchant._id.toString()); return { _id: order._id, orderNumber: order.orderNumber, customer: order.customer, status: order.status, paymentStatus: order.paymentStatus, createdAt: order.createdAt, items: myItems, myTotal: myItems.reduce((s,i)=>s+i.lineTotal,0), myCommission: myItems.reduce((s,i)=>s+i.commissionAmount,0), myNet: myItems.reduce((s,i)=>s+i.merchantAmount,0) }; }); res.json({ orders: scoped }); } catch (err) { next(err); } };

exports.getMerchantSales = async (req, res, next) => {
  try {
    const requestedPage = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const merchantId = new mongoose.Types.ObjectId(req.merchant._id);

    const [result] = await Order.aggregate([
      { $match: { 'items.merchant': merchantId } },
      {
        $project: {
          orderNumber: 1,
          createdAt: 1,
          items: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: { $eq: ['$$item.merchant', merchantId] },
            },
          },
        },
      },
      {
        $set: {
          myTotal: { $sum: '$items.lineTotal' },
          myCommission: { $sum: '$items.commissionAmount' },
          myNet: { $sum: '$items.merchantAmount' },
        },
      },
      {
        $facet: {
          orders: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: (requestedPage - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                orderNumber: 1,
                createdAt: 1,
                myTotal: 1,
                myCommission: 1,
                myNet: 1,
              },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                myTotal: { $sum: '$myTotal' },
                myCommission: { $sum: '$myCommission' },
                myNet: { $sum: '$myNet' },
              },
            },
          ],
        },
      },
    ]);

    const summary = result?.summary?.[0] || {
      total: 0,
      myTotal: 0,
      myCommission: 0,
      myNet: 0,
    };
    const total = Number(summary.total || 0);
    const pages = Math.ceil(total / limit);

    res.json({
      orders: result?.orders || [],
      total,
      page: requestedPage,
      limit,
      pages,
      totals: {
        myTotal: Number(summary.myTotal || 0),
        myCommission: Number(summary.myCommission || 0),
        myNet: Number(summary.myNet || 0),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => { try { const order = await Order.findById(req.params.id); if (!order) return res.status(404).json({ message: 'الطلب غير موجود' }); const isOwner = order.user.toString() === req.user._id.toString(); const isAdmin = req.user.role === 'admin'; const isMerchant = req.user.role === 'merchant' && order.items.some((i) => i.merchant && i.merchant.toString() === req.merchant?._id?.toString()); if (!isOwner && !isAdmin && !isMerchant) return res.status(403).json({ message: 'غير مصرح' }); res.json({ order: isOwner ? sanitizeCustomerOrder(order) : order }); } catch (err) { next(err); } };