const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const StaffMember = require('../models/StaffMember');

const roleDefaults = {
  super_admin: { all: true },
  orders_manager: { orders: ['view','create','edit'], payments: ['view','edit'] },
  products_manager: { products: ['view','create','edit','delete'], categories: ['view','create','edit','delete'] },
  marketing_manager: { marketing: ['view','create','edit','delete'], studio: ['view','create','edit','delete'] },
  support: { customers: ['view','edit'], support: ['view','create','edit','delete'] },
  accountant: { payments: ['view','edit'], reports: ['view'] },
  cashier: { orders: ['view','edit'], payments: ['view','edit'] },
  viewer: { allView: true },
};

const routePermission = (req) => {
  const base = String(req.baseUrl || '').replace(/^\/api\//, '').replace(/\//g, '');
  const path = String(req.path || '');
  if (base === 'orders') return path.startsWith('/stats') ? 'dashboard' : 'orders';
  if (base === 'products') return 'products';
  if (base === 'categories') return 'products';
  if (['banners','campaigns','offers','coupons','gift-cards','loyalty'].includes(base)) return 'marketing';
  if (['customers','support','chat'].includes(base)) return base === 'customers' ? 'customers' : 'support';
  if (base === 'payment-methods') return 'payments';
  if (base === 'staff') return 'staff';
  if (base === 'settings') return 'settings';
  if (base === 'models') return 'merchants';
  if (['merchants'].includes(base)) return 'merchants';
  if (['homepage','trend','stories','live','live-obs','ai'].includes(base)) return 'marketing';
  if (base === 'upload') return 'products';
  return path.includes('stats') || base === 'reports' ? 'reports' : 'dashboard';
};

const methodAction = (method) => ({ GET: 'view', HEAD: 'view', OPTIONS: 'view', POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete' }[method] || 'view');

const hasPermission = (req, moduleName, action) => {
  if (req.user?.role === 'admin') return true;
  if (req.user?.role !== 'staff' || !req.staff) return false;
  if (req.staff.role === 'super_admin') return true;
  const custom = req.staff.permissions?.[moduleName];
  if (custom && typeof custom === 'object' && Object.prototype.hasOwnProperty.call(custom, action)) return custom[action] === true;
  const defaults = roleDefaults[req.staff.role] || {};
  if (defaults.allView && action === 'view') return true;
  if (defaults.allView) return false;
  const allowed = defaults[moduleName] || [];
  return allowed.includes(action);
};

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'غير مصرح - يرجى تسجيل الدخول' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'المستخدم غير موجود أو غير نشط' });
    req.user = user;
    if (user.role === 'staff') {
      req.staff = await StaffMember.findOne({ email: user.email, isActive: true }).lean();
      if (!req.staff) return res.status(403).json({ message: 'حساب الموظف غير مفعّل أو غير مسجل ضمن الفريق' });
    }
    if (user.role === 'merchant') req.merchant = await Merchant.findOne({ user: user._id });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'جلسة غير صالحة، يرجى تسجيل الدخول مجددًا' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  if (req.user?.role !== 'staff' || !req.staff) return res.status(403).json({ message: 'هذا الإجراء متاح للمشرفين وفريق الإدارة فقط' });
  const moduleName = routePermission(req);
  const action = methodAction(req.method);
  if (!hasPermission(req, moduleName, action)) return res.status(403).json({ message: 'لا تملك صلاحية تنفيذ هذا الإجراء' });
  next();
};

exports.merchantOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'merchant' || !req.merchant) return res.status(403).json({ message: 'هذا الإجراء متاح للتجار فقط' });
  next();
};

exports.approvedMerchantOnly = (req, res, next) => {
  if (!req.merchant || req.merchant.status !== 'approved') {
    return res.status(403).json({
      message: req.merchant?.status === 'pending' ? 'حسابك كتاجر قيد المراجعة حاليًا، سيتم إعلامك عند الموافقة' : 'حسابك كتاجر موقوف حاليًا، تواصل مع الدعم',
    });
  }
  next();
};
