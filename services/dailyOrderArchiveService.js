const Order = require('../models/Order');
const DailyOrderReport = require('../models/DailyOrderReport');

const EGYPT_TIME_ZONE = 'Africa/Cairo';

function datePartsInEgypt(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EGYPT_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

function egyptDateString(date = new Date()) {
  const p = datePartsInEgypt(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function egyptDayBounds(dateString) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  if (!year || !month || !day) throw new Error('التاريخ يجب أن يكون بصيغة YYYY-MM-DD');
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const noonParts = new Intl.DateTimeFormat('en-US', {
    timeZone: EGYPT_TIME_ZONE,
    hour12: false, hour: '2-digit', timeZoneName: 'shortOffset',
  }).formatToParts(new Date(Date.UTC(year, month - 1, day, 12)));
  const offsetPart = noonParts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+3';
  const offsetHours = Number(String(offsetPart).replace('GMT', '')) || 3;
  const periodStart = new Date(start.getTime() - offsetHours * 60 * 60 * 1000);
  const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
  return { periodStart, periodEnd };
}

function previousEgyptDate() {
  const now = new Date();
  const p = datePartsInEgypt(now);
  const utc = new Date(Date.UTC(p.year, p.month - 1, p.day));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}

function buildSnapshot(order) {
  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total,
    totalCommissionAmount: order.totalCommissionAmount,
    totalMerchantAmount: order.totalMerchantAmount,
    placedAt: order.placedAt || order.createdAt,
    items: (order.items || []).map((item) => ({
      product: item.product?._id || item.product || null,
      nameSnapshot: item.nameSnapshot,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || {},
      merchant: item.merchant?._id || item.merchant || null,
      merchantName: item.merchant?.storeName || item.merchant?.name || 'تاجر',
      lineTotal: item.lineTotal,
      commissionAmount: item.commissionAmount,
      merchantAmount: item.merchantAmount,
    })),
  };
}

async function archiveDailyOrders(reportDate) {
  const date = reportDate || previousEgyptDate();
  const existing = await DailyOrderReport.findOne({ reportDate: date });
  if (existing) return existing;

  const { periodStart, periodEnd } = egyptDayBounds(date);
  const orders = await Order.find({
    isArchived: false,
    status: { $in: ['delivered', 'cancelled'] },
    createdAt: { $gte: periodStart, $lt: periodEnd },
  })
    .populate('items.merchant', 'name storeName')
    .sort('createdAt')
    .lean();

  const snapshots = orders.map(buildSnapshot);
  const paymentSummary = {};
  const statusSummary = {};
  const merchants = new Map();
  let totalSales = 0;
  let totalDiscount = 0;
  let totalShipping = 0;
  let totalCommission = 0;
  let totalMerchantAmount = 0;

  for (const order of orders) {
    paymentSummary[order.paymentStatus] = (paymentSummary[order.paymentStatus] || 0) + 1;
    statusSummary[order.status] = (statusSummary[order.status] || 0) + 1;
    totalSales += Number(order.total || 0);
    totalDiscount += Number(order.discount || 0);
    totalShipping += Number(order.shippingFee || 0);
    totalCommission += Number(order.totalCommissionAmount || 0);
    totalMerchantAmount += Number(order.totalMerchantAmount || 0);
    for (const item of order.items || []) {
      if (!item.merchant) continue;
      const id = String(item.merchant._id || item.merchant);
      const row = merchants.get(id) || {
        merchantId: item.merchant._id || item.merchant,
        merchantName: item.merchant?.storeName || item.merchant?.name || 'تاجر',
        orders: 0, quantity: 0, sales: 0, commission: 0, merchantAmount: 0,
      };
      row.quantity += Number(item.quantity || 0);
      row.sales += Number(item.lineTotal || 0);
      row.commission += Number(item.commissionAmount || 0);
      row.merchantAmount += Number(item.merchantAmount || 0);
      merchants.set(id, row);
    }
  }
  for (const row of merchants.values()) row.orders = snapshots.filter((o) => o.items.some((i) => String(i.merchant) === String(row.merchantId))).length;

  const report = await DailyOrderReport.create({
    reportDate: date,
    periodStart,
    periodEnd,
    orders: snapshots,
    orderCount: orders.length,
    totalSales,
    totalDiscount,
    totalShipping,
    totalCommission,
    totalMerchantAmount,
    paymentSummary,
    statusSummary,
    merchantSummary: Array.from(merchants.values()),
    archivedOrderIds: orders.map((o) => o._id),
    generatedAt: new Date(),
    archivedAt: new Date(),
  });

  if (orders.length) {
    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) }, isArchived: false, status: { $in: ['delivered', 'cancelled'] } },
      { $set: { isArchived: true, archivedAt: new Date(), dailyReport: report._id } }
    );
  }
  return report;
}

module.exports = { archiveDailyOrders, egyptDateString, previousEgyptDate };
