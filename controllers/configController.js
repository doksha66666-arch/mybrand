const StoreSettings = require('../models/StoreSettings');

// إعدادات عامة غير حساسة يحتاجها التطبيق والمعروضة للعميل (رقم الدفع، إلخ)
exports.getPublicConfig = async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne({ key: 'global' }).lean();
    res.json({
      store: {
        storeName: settings?.storeName || 'MYBRAND',
        currency: settings?.currency || 'EGP',
        timezone: settings?.timezone || 'Africa/Cairo',
        maintenance: Boolean(settings?.maintenance),
      },
      vodafoneCashNumber: process.env.MERCHANT_VODAFONE_CASH_NUMBER || '',
      paymentMethods: {
        cod: true,
        vodafoneCash: Boolean(process.env.MERCHANT_VODAFONE_CASH_NUMBER),
      },
    });
  } catch (error) {
    next(error);
  }
};
