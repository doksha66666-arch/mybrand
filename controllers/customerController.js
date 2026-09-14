const User = require('../models/User');

const customerListProjection = 'name email phone role isActive createdAt';

exports.getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const filter = { role: 'customer' };
    const customers = await User.find(filter)
      .select(customerListProjection)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .sort('-createdAt')
      .lean();
    const total = await User.countDocuments(filter);
    res.json({ customers, total, page: safePage, limit: safeLimit });
  } catch (err) {
    next(err);
  }
};

exports.toggleCustomerStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!user) return res.status(404).json({ message: 'العميل غير موجود' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user: { id: user._id, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const result = await User.deleteOne({ _id: req.params.id, role: 'customer' });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    return res.json({ message: 'تم حذف العميل نهائيًا' });
  } catch (err) {
    next(err);
  }
};
