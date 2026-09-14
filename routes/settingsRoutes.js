const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');
const { protect, adminOnly } = require('../middleware/auth');

const DEFAULTS = {
  key: 'global',
  storeName: 'MYBRAND',
  storeEmail: 'admin@mybrand.com',
  phone: '',
  currency: 'EGP',
  timezone: 'Africa/Cairo',
  maintenance: false,
  newOrder: true,
  lowStock: true,
  customerMessage: true,
};

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: DEFAULTS },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const payload = {
      storeName: String(body.storeName ?? DEFAULTS.storeName).trim().slice(0, 120),
      storeEmail: String(body.storeEmail ?? DEFAULTS.storeEmail).trim().slice(0, 200),
      phone: String(body.phone ?? '').trim().slice(0, 40),
      currency: ['EGP', 'USD', 'SAR'].includes(body.currency) ? body.currency : DEFAULTS.currency,
      timezone: ['Africa/Cairo', 'UTC', 'Asia/Riyadh'].includes(body.timezone) ? body.timezone : DEFAULTS.timezone,
      maintenance: Boolean(body.maintenance),
      newOrder: Boolean(body.newOrder),
      lowStock: Boolean(body.lowStock),
      customerMessage: Boolean(body.customerMessage),
    };

    const settings = await StoreSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: payload, $setOnInsert: { key: 'global' } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ message: 'تم حفظ الإعدادات مركزيًا', settings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
