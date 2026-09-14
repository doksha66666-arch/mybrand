const Category = require('../models/Category');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

exports.getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.sortOrder === undefined) {
      const last = await Category.findOne().sort({ sortOrder: -1 });
      payload.sortOrder = last ? last.sortOrder + 1 : 0;
    }
    const category = await Category.create(payload);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ message: 'القسم غير موجود' });
    res.json({ category });
  } catch (err) {
    next(err);
  }
};

exports.reorderCategories = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ message: 'بيانات الترتيب غير صالحة' });
    await Category.bulkWrite(items.map((item, index) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { sortOrder: index } },
      },
    })));
    const categories = await Category.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'القسم غير موجود' });
    res.json({ message: 'تم حذف القسم' });
  } catch (err) {
    next(err);
  }
};
