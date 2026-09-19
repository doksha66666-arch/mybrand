const mongoose = require('mongoose');
const StoreSettings = require('../models/StoreSettings');
const Merchant = require('../models/Merchant');

exports.getPublicConfig = async (req, res, next) => {
  try {
    const merchantId = String(req.query?.merchant || '').trim();
    if (merchantId) {
      if (!mongoose.isValidObjectId(merchantId)) return res.status(400).json({ message: 'معرف المتجر غير صالح' });
      const merchant = await Merchant.findOne({ _id: merchantId, status: 'approved' })
        .select('businessName storeName businessDescription storefront')
        .lean();
      if (!merchant) return res.status(404).json({ message: 'المتجر غير متاح حاليًا' });
      const pageLayouts = merchant.storefront?.pageLayouts && typeof merchant.storefront.pageLayouts === 'object' && !Array.isArray(merchant.storefront.pageLayouts)
        ? merchant.storefront.pageLayouts
        : {};
      return res.json({
        store: {
          storeName: merchant.storeName || merchant.businessName || 'متجر MYBRAND',
          businessName: merchant.businessName || '',
          businessDescription: merchant.businessDescription || '',
          merchantId: String(merchant._id),
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          maintenance: false,
        },
        pageLayouts,
        vodafoneCashNumber: process.env.MERCHANT_VODAFONE_CASH_NUMBER || '',
        paymentMethods: { cod: true, vodafoneCash: Boolean(process.env.MERCHANT_VODAFONE_CASH_NUMBER) },
      });
    }

    const settings = await StoreSettings.findOne({ key: 'global' }).lean();
    res.json({
      store: {
        storeName: settings?.storeName || 'MYBRAND',
        currency: settings?.currency || 'EGP',
        timezone: settings?.timezone || 'Africa/Cairo',
        maintenance: Boolean(settings?.maintenance),
      },
      pageLayouts: settings?.pageLayouts && typeof settings.pageLayouts === 'object' && !Array.isArray(settings.pageLayouts) ? settings.pageLayouts : {},
      vodafoneCashNumber: process.env.MERCHANT_VODAFONE_CASH_NUMBER || '',
      paymentMethods: { cod: true, vodafoneCash: Boolean(process.env.MERCHANT_VODAFONE_CASH_NUMBER) },
    });
  } catch (error) {
    next(error);
  }
};
