const StaffMember = require('../models/StaffMember');
const User = require('../models/User');

const allowedRoles = new Set(['super_admin', 'orders_manager', 'products_manager', 'marketing_manager', 'support', 'accountant', 'cashier', 'viewer']);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const MIN_PASSWORD_LENGTH = 12;
const safePermissions = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const canManageSuperAdmin = (req) => req.user?.role === 'admin' || req.staff?.role === 'super_admin';

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
    const permissions = safePermissions(req.body.permissions);
    if (!name || !email || !password) return res.status(400).json({ message: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    if (!/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email)) return res.status(400).json({ message: 'يرجى إدخال بريد إلكتروني صحيح' });
    if (password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `كلمة مرور الموظف يجب أن تكون ${MIN_PASSWORD_LENGTH} حرفًا على الأقل` });
    if (!allowedRoles.has(role)) return res.status(400).json({ message: 'الدور المحدد غير صالح' });
    if (role === 'super_admin' && !canManageSuperAdmin(req)) return res.status(403).json({ message: 'لا يمكن إلا للمشرف الرئيسي إنشاء حساب super_admin' });
    const [staffExists, userExists] = await Promise.all([StaffMember.findOne({ email }).select('_id'), User.findOne({ email }).select('_id')]);
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

exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'عضو الفريق غير موجود' });
    if (String(staff.email) === String(req.user?.email)) return res.status(400).json({ message: 'لا يمكن تعديل حسابك الإداري من هنا' });
    const linkedAccount = await User.findOne({ email: staff.email, role: 'staff' }).select('+password');
    if (!linkedAccount) return res.status(404).json({ message: 'حساب الدخول المرتبط غير موجود' });
    const oldEmail = staff.email;
    const name = String(req.body.name ?? staff.name).trim();
    const email = normalizeEmail(req.body.email ?? staff.email);
    const phone = String(req.body.phone ?? staff.phone ?? '').trim();
    const role = String(req.body.role ?? staff.role);
    if (!name || !email) return res.status(400).json({ message: 'الاسم والبريد الإلكتروني مطلوبان' });
    if (!/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email)) return res.status(400).json({ message: 'يرجى إدخال بريد إلكتروني صحيح' });
    if (!allowedRoles.has(role)) return res.status(400).json({ message: 'الدور المحدد غير صالح' });
    if (role === 'super_admin' && !canManageSuperAdmin(req)) return res.status(403).json({ message: 'لا يمكن إلا للمشرف الرئيسي ترقية عضو إلى super_admin' });
    if (email !== staff.email) {
      const [staffExists, userExists] = await Promise.all([StaffMember.findOne({ email, _id: { $ne: staff._id } }).select('_id'), User.findOne({ email }).select('_id')]);
      if (staffExists || userExists) return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    const password = req.body.password === undefined ? '' : String(req.body.password);
    if (password && password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} حرفًا على الأقل` });
    staff.name = name; staff.email = email; staff.phone = phone; staff.role = role;
    if (req.body.permissions !== undefined) staff.permissions = safePermissions(req.body.permissions);
    if (req.body.isActive !== undefined) staff.isActive = Boolean(req.body.isActive);
    linkedAccount.name = name; linkedAccount.email = email; linkedAccount.phone = phone || undefined; linkedAccount.isActive = staff.isActive;
    if (password) linkedAccount.password = password;
    await Promise.all([staff.save(), linkedAccount.save()]);
    res.json({ staff: { ...staff.toObject(), userId: linkedAccount._id, previousEmail: oldEmail !== email ? oldEmail : undefined } });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    next(err);
  }
};

exports.removeStaff = async (req, res, next) => {
  try {
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'عضو الفريق غير موجود' });
    if (String(staff.email) === String(req.user?.email)) return res.status(400).json({ message: 'لا يمكن حذف حسابك الإداري من هنا' });
    if (staff.role === 'super_admin') return res.status(400).json({ message: 'لا يمكن حذف حساب super_admin من لوحة الفريق' });
    const account = await User.findOne({ email: staff.email, role: 'staff' }).select('_id');
    await StaffMember.deleteOne({ _id: staff._id });
    if (account) await User.deleteOne({ _id: account._id });
    res.json({ message: 'تم حذف عضو الفريق وحساب الدخول المرتبط به' });
  } catch (err) { next(err); }
};
