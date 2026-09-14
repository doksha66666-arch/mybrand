const DailyOrderReport = require('../models/DailyOrderReport');
const { archiveDailyOrders, previousEgyptDate } = require('../services/dailyOrderArchiveService');

exports.getDailyReports = async (req, res, next) => {
  try {
    const reports = await DailyOrderReport.find({})
      .select('-orders')
      .sort({ reportDate: -1 })
      .limit(90)
      .lean();
    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

exports.getDailyReport = async (req, res, next) => {
  try {
    const report = await DailyOrderReport.findOne({ reportDate: req.params.date }).lean();
    if (!report) return res.status(404).json({ message: 'التقرير اليومي غير موجود' });
    res.json({ report });
  } catch (error) {
    next(error);
  }
};

exports.archiveDailyReport = async (req, res, next) => {
  try {
    const reportDate = String(req.body?.date || previousEgyptDate()).trim();
    const report = await archiveDailyOrders(reportDate);
    res.json({ message: 'تمت أرشفة الطلبات النهائية وإعداد التقرير اليومي', report });
  } catch (error) {
    next(error);
  }
};
