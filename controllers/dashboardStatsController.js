const Order = require('../models/Order');
const { adminOnly } = require('../middleware/auth');

const baseMatch = { isArchived: { $ne: true }, status: { $ne: 'cancelled' } };

exports.getDashboardStats = [adminOnly, async (req, res, next) => {
  try {
    const [summary] = await Order.aggregate([
      { $match: baseMatch },
      { $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        ordersCount: { $sum: 1 },
        averageOrder: { $avg: '$total' },
      } },
    ]);

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 6);

    const dailyRows = await Order.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const byDay = new Map(dailyRows.map((row) => [row._id, row]));
    const salesByDay = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(since);
      date.setDate(since.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      const row = byDay.get(key);
      salesByDay.push({ date: key, sales: Number(row?.sales || 0), orders: Number(row?.orders || 0) });
    }

    const categoryRows = await Order.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
      { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$product.category', name: { $first: { $ifNull: ['$category.nameAr', 'غير مصنف'] } }, sales: { $sum: '$items.lineTotal' } } },
      { $sort: { sales: -1 } },
      { $limit: 6 },
    ]);

    const topProductRows = await Order.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.nameSnapshot' }, units: { $sum: '$items.quantity' }, sales: { $sum: '$items.lineTotal' } } },
      { $sort: { units: -1, sales: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalSales: Number(summary?.totalSales || 0),
      ordersCount: Number(summary?.ordersCount || 0),
      averageOrder: Number(summary?.averageOrder || 0),
      salesByDay,
      categorySales: categoryRows.map((row) => ({ name: row.name, sales: Number(row.sales || 0) })),
      topProducts: topProductRows.map((row) => ({ name: row.name || 'منتج', units: Number(row.units || 0), sales: Number(row.sales || 0) })),
    });
  } catch (error) {
    next(error);
  }
}];
