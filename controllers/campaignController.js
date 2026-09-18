const Campaign = require('../models/Campaign');

// GET /api/campaigns - عام - الفعاليات المفعّلة والسارية حاليًا فقط
exports.getActiveCampaigns = async (req, res, next) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } })
      .populate('products', 'nameAr slug images price')
      .populate('categories', 'nameAr slug')
      .sort('sortOrder');
    res.json({ campaigns });
  } catch (err) {
    next(err);
  }
};

// GET /api/campaigns/all - Admin فقط - كل الفعاليات (بكل حالاتها)
exports.getAllCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const [campaigns, total] = await Promise.all([
      Campaign.find({})
        .populate('products', 'nameAr')
        .populate('categories', 'nameAr')
        .populate('merchants', 'businessName')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Campaign.countDocuments({}),
    ]);
    res.json({ campaigns, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.createCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json({ campaign });
  } catch (err) {
    next(err);
  }
};

exports.updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    Object.assign(campaign, req.body);
    await campaign.save();
    res.json({ campaign });
  } catch (err) {
    next(err);
  }
};

exports.toggleCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    campaign.isActive = !campaign.isActive;
    await campaign.save();
    res.json({ campaign });
  } catch (err) {
    next(err);
  }
};

exports.deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    res.json({ message: 'تم حذف الفعالية' });
  } catch (err) {
    next(err);
  }
};
