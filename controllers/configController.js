const StoreSettings = require('../models/StoreSettings');

const DEFAULT_THEME = {
  accent: '#0F172A',
  accentSoft: '#F1F5F9',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  border: '#E5E7EB',
  radius: 18,
};

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
      pageLayouts: settings?.pageLayouts && typeof settings.pageLayouts === 'object' && !Array.isArray(settings.pageLayouts) ? settings.pageLayouts : {},
      theme: { ...DEFAULT_THEME, ...(settings?.theme || {}) },
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
