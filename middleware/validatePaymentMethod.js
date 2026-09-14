const PaymentMethod = require('../models/PaymentMethod');

// Validate the payment method against the currently active and checkout-ready store configuration.
// The checkout UI is not a security boundary: disabled or unconfigured methods must also
// be rejected when a client calls the orders API directly.
module.exports = async (req, res, next) => {
  try {
    const requested = String(req.body?.paymentMethod || '').trim().toLowerCase();
    if (!requested) return next();

    const aliases = {
      cod: 'cod',
      card: 'cards',
      cards: 'cards',
      vodafone_cash: 'vodafone',
      vodafone: 'vodafone',
      wallet: 'instapay',
      instapay: 'instapay',
    };

    const key = aliases[requested];
    if (!key) {
      return res.status(400).json({ message: 'طريقة الدفع غير مدعومة' });
    }

    const method = await PaymentMethod.findOne({ key, isActive: true }).lean();
    if (!method) {
      return res.status(409).json({ message: 'طريقة الدفع المختارة غير متاحة حاليًا' });
    }

    // Gateway methods are not real payment processing yet. Never allow a client
    // to create an order that looks like a gateway payment was accepted.
    if (method.type === 'gateway') {
      return res.status(409).json({ message: 'بوابة الدفع الإلكتروني غير مفعّلة حاليًا' });
    }

    // Manual-transfer methods need a destination/account value configured by the admin.
    if (method.type === 'manual_transfer' && !String(method.displayValue || '').trim()) {
      return res.status(409).json({ message: 'طريقة التحويل المختارة غير مكتملة الإعداد حاليًا' });
    }

    req.body.paymentMethod = requested === 'cards' ? 'card' : requested;
    return next();
  } catch (error) {
    return next(error);
  }
};
