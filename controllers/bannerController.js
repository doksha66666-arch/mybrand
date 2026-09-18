const Banner = require('../models/Banner');

const BANNER_FIELDS = ['titleAr', 'subtitleAr', 'image', 'buttonTextAr', 'buttonLink', 'isActive', 'sortOrder', 'placements'];

function pickAllowed(source = {}) {
  const out = BANNER_FIELDS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) acc[key] = source[key];
    return acc;
  }, {});
  if (Array.isArray(out.placements)) {
    out.placements = [...new Set(out.placements)].filter((p) => Banner.PLACEMENTS.includes(p));
  }
  return out;
}

exports.getActiveBanners = async (req, res, next) => {
  try {
    const placement = String(req.query.placement || '').trim();
    const filter = { isActive: true };
    if (placement && Banner.PLACEMENTS.includes(placement)) filter.placements = placement;
    const banners = await Banner.find(filter)
      .select(BANNER_FIELDS.join(' '))
      .sort({ sortOrder: 1, _id: 1 })
      .lean();
    res.json({ banners });
  } catch (err) { next(err); }
};

exports.getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({})
      .select(BANNER_FIELDS.join(' '))
      .sort({ sortOrder: 1, _id: 1 })
      .lean();
    res.json({ banners });
  } catch (err) { next(err); }
};

exports.createBanner = async (req, res, next) => {
  try {
    const payload = pickAllowed(req.body);
    if (!payload.placements?.length) payload.placements = ['home'];
    const banner = await Banner.create(payload);
    res.status(201).json({ banner });
  } catch (err) { next(err); }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const payload = pickAllowed(req.body);
    if (Object.prototype.hasOwnProperty.call(payload, 'placements') && !payload.placements.length) payload.placements = ['home'];
    const banner = await Banner.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ message: 'البانر غير موجود' });
    res.json({ banner });
  } catch (err) { next(err); }
};

exports.toggleBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'البانر غير موجود' });
    banner.isActive = !banner.isActive;
    await banner.save();
    res.json({ banner });
  } catch (err) { next(err); }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'البانر غير موجود' });
    res.json({ message: 'تم حذف البانر' });
  } catch (err) { next(err); }
};
