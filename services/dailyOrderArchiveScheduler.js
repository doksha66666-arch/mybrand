const cron = require('node-cron');
const { archiveDailyOrders, previousEgyptDate } = require('./dailyOrderArchiveService');

function startDailyOrderArchiveScheduler() {
  // كل يوم 00:05 بتوقيت مصر: أرشفة طلبات اليوم السابق التي انتهت فقط.
  const task = cron.schedule('5 0 * * *', async () => {
    const reportDate = previousEgyptDate();
    try {
      const report = await archiveDailyOrders(reportDate);
      console.log(`[orders] Daily archive completed for ${reportDate}: ${report.orderCount} final orders.`);
    } catch (error) {
      console.error(`[orders] Daily archive failed for ${reportDate}:`, error);
    }
  }, { timezone: 'Africa/Cairo' });

  console.log('Daily order archive scheduler started (00:05 Africa/Cairo).');
  return task;
}

module.exports = { startDailyOrderArchiveScheduler };
