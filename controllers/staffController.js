const StaffMember = require('../models/StaffMember');
const User = require('../models/User');

const allowedRoles = new Set(['super_admin', 'orders_manager', 'products_manager', 'marketing_manager', 'support', 'accountant', 'cashier', 'viewer']);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const MIN_PASSWORD_LENGTH = 12;

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
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'viewer');
    const permissions = req.body.permissions && typeof req.body.permissions === 'object' && !Array.isArray(req.body.permissions) ? req.body.permissions : {};

    if (!name || !email || !password) return res.status(400).json({ message: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'يرجى إدخال بريد إلكتروني صحيح' });
    if (password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `كلمة مرور الموظف يجب أن تكون ${MIN_PASSWORD_LENGTH} حرفًا على الأقل` });
    if (!allowedRoles.has(role)) return res.status(400).json({ message: 'الدور المحدد غير صالح' });

    const [staffExists, userExists] = await Promise.all([
      StaffMember.findOne({ email }).select('_id'),
      User.findOne({ email }).select('_id'),
    ]);
    if (staffExists || userExists) return res.status(409).json({ message: 'يوجد حساب أو مسئول مسجل بهذا البريد بالفعل' });

    const user = await User.create({ name, email, phone: phone || undefined, password, role: 'staff', isEmailVerified: true, isActive: true });
    try {
      const staff = await StaffMember.create({ name, email, phone, role, permissions, isActive: true });
      res.status(201).json({ staff: { ...staff.toObject(), userId: user._id } });
    } catch (staffError) {
      await User.deleteOne({ _id: user._id });
      throw staffError;
    }
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    next(err);
  }
};
