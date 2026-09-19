const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');
const { protect, adminOnly } = require('../middleware/auth');

const DEFAULTS = {
  key: 'global',
  storeName: 'MYBRAND',
  storeEmail: 'admin@mybrand.com',
  phone: '',
  currency: 'EGP',
  timezone: 'Africa/Cairo',
  maintenance: false,
  newOrder: true,
  lowStock: true,
  customerMessage: true,
  pageLayouts: {},
  theme: {
    accent: '#0F172A',
    accentSoft: '#F1F5F9',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#111827',
    border: '#E5E7EB',
    radius: 18,
  },
};

const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const normalizeTheme = (value = {}) => ({
  accent: COLOR_RE.test(String(value.accent || '')) ? String(value.accent) : DEFAULTS.theme.accent,
  accentSoft: COLOR_RE.test(String(value.accentSoft || '')) ? String(value.accentSoft) : DEFAULTS.theme.accentSoft,
  background: COLOR_RE.test(String(value.background || '')) ? String(value.background) : DEFAULTS.theme.background,
  surface: COLOR_RE.test(String(value.surface || '')) ? String(value.surface) : DEFAULTS.theme.surface,
  text: COLOR_RE.test(String(value.text || '')) ? String(value.text) : DEFAULTS.theme.text,
  border: COLOR_RE.test(String(value.border || '')) ? String(value.border) : DEFAULTS.theme.border,
  radius: Math.min(32, Math.max(8, Number(value.radius) || DEFAULTS.theme.radius)),
  buttonRadius: Math.min(24, Math.max(6, Number(value.buttonRadius) || DEFAULTS.theme.buttonRadius)),
  contentWidth: Math.min(1500, Math.max(980, Number(value.contentWidth) || DEFAULTS.theme.contentWidth)),
  fontScale: Math.min(1.1, Math.max(0.9, Number(value.fontScale) || DEFAULTS.theme.fontScale)),
  shadow: Math.min(3, Math.max(0, Number.isFinite(Number(value.shadow)) ? Number(value.shadow) : DEFAULTS.theme.shadow)),
});

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: DEFAULTS },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    const body = isPlainObject(req.body) ? req.body : {};
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'storeName')) payload.storeName = String(body.storeName).trim().slice(0, 120);
    if (Object.prototype.hasOwnProperty.call(body, 'storeEmail')) payload.storeEmail = String(body.storeEmail).trim().slice(0, 200);
    if (Object.prototype.hasOwnProperty.call(body, 'phone')) payload.phone = String(body.phone).trim().slice(0, 40);
    if (Object.prototype.hasOwnProperty.call(body, 'currency') && ['EGP', 'USD', 'SAR'].includes(body.currency)) payload.currency = body.currency;
    if (Object.prototype.hasOwnProperty.call(body, 'timezone') && ['Africa/Cairo', 'UTC', 'Asia/Riyadh'].includes(body.timezone)) payload.timezone = body.timezone;
    if (Object.prototype.hasOwnProperty.call(body, 'maintenance')) payload.maintenance = Boolean(body.maintenance);
    if (Object.prototype.hasOwnProperty.call(body, 'newOrder')) payload.newOrder = Boolean(body.newOrder);
    if (Object.prototype.hasOwnProperty.call(body, 'lowStock')) payload.lowStock = Boolean(body.lowStock);
    if (Object.prototype.hasOwnProperty.call(body, 'customerMessage')) payload.customerMessage = Boolean(body.customerMessage);
    if (Object.prototype.hasOwnProperty.call(body, 'pageLayouts') && isPlainObject(body.pageLayouts)) payload.pageLayouts = body.pageLayouts;
    if (Object.prototype.hasOwnProperty.call(body, 'theme') && isPlainObject(body.theme)) payload.theme = normalizeTheme(body.theme);

    if (!Object.keys(payload).length) return res.status(400).json({ message: 'لا توجد إعدادات صالحة للحفظ' });

    const settings = await StoreSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: payload, $setOnInsert: { key: 'global', ...DEFAULTS } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ message: 'تم حفظ الإعدادات مركزيًا', settings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
