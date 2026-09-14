const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/PaymentMethod');

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

// Checkout must work on a fresh database before an admin has opened the payment settings page.
async function ensureDefaults() {
  const count = await PaymentMethod.countDocuments();
  if (count === 0) await PaymentMethod.insertMany(DEFAULT_METHODS);
}

// Public checkout endpoint: only methods that the current checkout contract can actually process.
// Gateway methods stay hidden until a real gateway integration exists.
function checkoutReadyFilter() {
  return {
    isActive: true,
    $or: [
      { type: 'cod' },
      { type: 'manual_transfer', displayValue: { $nin: ['', null] } },
    ],
  };
}

// Public checkout endpoint: active methods only, never expose internalConfig.
router.get('/', async (req, res, next) => {
  try {
    await ensureDefaults();
    const methods = await PaymentMethod.find(checkoutReadyFilter())
      .select('-internalConfig')
      .sort({ sortOrder: 1 })
      .lean();

    res.json({ paymentMethods: methods });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
