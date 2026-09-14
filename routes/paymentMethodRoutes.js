const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/PaymentMethod');
const PaymentSettings = require('../models/PaymentSettings');
const { protect, adminOnly } = require('../middleware/auth');

// Safe first-run defaults: only COD is active until the admin configures
// manual-transfer details or a real payment gateway.
const DEFAULT_METHODS = [
  { key: 'cod', nameAr: 'الدفع عند الاستلام', nameEn: 'Cash on Delivery', type: 'cod', descriptionAr: 'يدفع العميل نقدًا عند وصول الطلب', isActive: true, sortOrder: 0 },
  { key: 'cards', nameAr: 'فيزا / ماستركارد', nameEn: 'Visa / Mastercard', type: 'gateway', descriptionAr: 'عبر بوابة الدفع الإلكتروني', isActive: false, sortOrder: 1 },
  { key: 'vodafone', nameAr: 'فودافون كاش', nameEn: 'Vodafone Cash', type: 'manual_transfer', descriptionAr: 'محفظة إلكترونية', isActive: false, sortOrder: 2 },
  { key: 'instapay', nameAr: 'إنستاباي', nameEn: 'InstaPay', type: 'manual_transfer', descriptionAr: 'تحويل بنكي فوري', isActive: false, sortOrder: 3 },
  { key: 'fawry', nameAr: 'فوري', nameEn: 'Fawry', type: 'gateway', descriptionAr: 'الدفع من أي منفذ فوري', isActive: false, sortOrder: 4 },
  { key: 'paypal', nameAr: 'باي بال', nameEn: 'PayPal', type: 'gateway', descriptionAr: 'للطلبات من خارج مصر', isActive: false, sortOrder: 5 },
];

async function ensureDefaults() {
  const count = await PaymentMethod.countDocuments();
  if (count === 0) await PaymentMethod.insertMany(DEFAULT_METHODS);
}

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    await ensureDefaults();
    const [methods, settings] = await Promise.all([
      PaymentMethod.find().sort({ sortOrder: 1 }).lean(),
      PaymentSettings.findOne({ key: 'global' }).lean(),
    ]);
    res.json({ methods, settings: settings || { partialPayment: false, codLimitEnabled: true, showGatewayFees: true, currency: 'جنيه مصري (EGP)', codLimit: '3000' } });
  } catch (error) { next(error); }
});

router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    await ensureDefaults();
    const methods = Array.isArray(req.body.methods) ? req.body.methods : [];
    const settings = req.body.settings && typeof req.body.settings === 'object' ? req.body.settings : {};

    for (const method of methods) {
      if (!method?.key) continue;
      await PaymentMethod.updateOne(
        { key: String(method.key).toLowerCase() },
        { $set: { isActive: Boolean(method.active ?? method.isActive) } }
      );
    }

    const savedSettings = await PaymentSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: {
        partialPayment: Boolean(settings.partialPayment),
        codLimitEnabled: Boolean(settings.codLimitEnabled),
        showGatewayFees: Boolean(settings.showGatewayFees),
        currency: String(settings.currency || 'جنيه مصري (EGP)'),
        codLimit: String(settings.codLimit || '3000').replace(/[^0-9.,]/g, ''),
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const savedMethods = await PaymentMethod.find().sort({ sortOrder: 1 }).lean();
    res.json({ message: 'تم حفظ إعدادات الدفع بنجاح', methods: savedMethods, settings: savedSettings });
  } catch (error) { next(error); }
});

module.exports = router;
