const Offer = require('../models/Offer');

// GET /api/offers - Admin فقط - كل العروض (نشطة ومنتهية ومعطّلة)
exports.getAllOffers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const [offers, total] = await Promise.all([
      Offer.find({})
        .populate('targetProduct', 'nameAr')
        .populate('targetCategory', 'nameAr')
        .populate({ path: 'targetMerchant', select: 'businessName' })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Offer.countDocuments({}),
    ]);
    res.json({ offers, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// POST /api/offers - Admin فقط
exports.createOffer = async (req, res, next) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
};

// PUT /api/offers/:id - Admin فقط
exports.updateOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'العرض غير موجود' });
    Object.assign(offer, req.body);
    await offer.save();
    res.json({ offer });
  } catch (err) {
    next(err);
  }
};

// PUT /api/offers/:id/toggle - Admin فقط - تفعيل/تعطيل سريع
exports.toggleOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'العرض غير موجود' });
    offer.isActive = !offer.isActive;
    await offer.save();
    res.json({ offer });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/offers/:id - Admin فقط
exports.deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: 'العرض غير موجود' });
    res.json({ message: 'تم حذف العرض' });
  } catch (err) {
    next(err);
  }
};
