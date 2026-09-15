const StaffMember = require('../models/StaffMember');

const allowedRoles = new Set(['super_admin', 'orders_manager', 'products_manager', 'marketing_manager', 'support', 'accountant', 'cashier', 'viewer']);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

exports.listStaff = async (req, res, next) => {
  try {
    const staff = await StaffMember.find({}).sort({ createdAt: -1 }).lean();
    res.json({ staff });
  } catch (err) { next(err); }
};

exports.createStaff = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone || '').trim();
    const role = String(req.body.role || 'viewer');
    const permissions = req.body.permissions && typeof req.body.permissions === 'object' && !Array.isArray(req.body.permissions) ? req.body.permissions : {};
    if (!name || !email) return res.status(400).json({ message: 'الاسم والبريد الإلكتروني مطلوبان' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'يرجى إدخال بريد إلكتروني صحيح' });
    if (!allowedRoles.has(role)) return res.status(400).json({ message: 'الدور المحدد غير صالح' });
    const exists = await StaffMember.findOne({ email }).select('_id');
    if (exists) return res.status(409).json({ message: 'يوجد مسئول مسجل بهذا البريد بالفعل' });
    const staff = await StaffMember.create({ name, email, phone, role, permissions });
    res.status(201).json({ staff });
  } catch (err) { next(err); }
};
