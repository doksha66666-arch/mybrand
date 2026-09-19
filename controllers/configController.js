const StoreSettings = require('../models/StoreSettings');

const DEFAULT_THEME = {
  accent: '#0F172A',
  accentSoft: '#F1F5F9',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  border: '#E5E7EB',
  radius: 18,
  buttonRadius: 12,
  contentWidth: 1200,
  fontScale: 1,
  shadow: 1,
};

const isHexColor = (value) => /^#[0-9A-Fa-f]{3,8}$/.test(String(value || '').trim());
const normalizeTheme = (theme = {}) => {
  const source = theme && typeof theme === 'object' && !Array.isArray(theme) ? theme : {};
  const numeric = (key, fallback, min, max) => {
    const value = Number(source[key]);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  };
  const color = (key, fallback) => isHexColor(source[key]) ? String(source[key]).trim() : fallback;
  return {
    accent: color('accent', DEFAULT_THEME.accent),
    accentSoft: color('accentSoft', DEFAULT_THEME.accentSoft),
    background: color('background', DEFAULT_THEME.background),
    surface: color('surface', DEFAULT_THEME.surface),
    text: color('text', DEFAULT_THEME.text),
    border: color('border', DEFAULT_THEME.border),
    radius: numeric('radius', DEFAULT_THEME.radius, 8, 32),
    buttonRadius: numeric('buttonRadius', DEFAULT_THEME.buttonRadius, 6, 24),
    contentWidth: numeric('contentWidth', DEFAULT_THEME.contentWidth, 980, 1500),
    fontScale: numeric('fontScale', DEFAULT_THEME.fontScale, 0.9, 1.1),
    shadow: numeric('shadow', DEFAULT_THEME.shadow, 0, 3),
  };
};

exports.getPublicConfig = async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne({ key: 'global' }).lean();
    res.json({
      store: {
        storeName: settings?.storeName || 'MYBRAND',
        currency: settings?.currency || 'EGP',
        timezone: settings?.timezone || 'Africa/Cairo',
        maintenance: Boolean(settings?.maintenance),
      },
      pageLayouts: settings?.pageLayouts && typeof settings.pageLayouts === 'object' && !Array.isArray(settings.pageLayouts) ? settings.pageLayouts : {},
      theme: normalizeTheme(settings?.theme || {}),
      vodafoneCashNumber: process.env.MERCHANT_VODAFONE_CASH_NUMBER || '',
      paymentMethods: {
        cod: true,
        vodafoneCash: Boolean(process.env.MERCHANT_VODAFONE_CASH_NUMBER),
      },
    });
  } catch (error) {
    next(error);
  }
};
