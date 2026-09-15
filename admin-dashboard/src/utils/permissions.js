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

const moduleForPath = (path) => {
  const clean = String(path || '/').replace(/^\//, '');
  if (!clean || clean === '/') return 'dashboard';
  const first = clean.split('/')[0];
  if (first === 'products') return 'products';
  if (first === 'categories') return 'categories';
  if (['orders','customers','payment-methods','merchants','models','staff','reports','settings'].includes(first)) return first === 'payment-methods' ? 'payments' : first;
  if (['banners','campaigns','offers','coupons','gift-cards','loyalty'].includes(first)) return 'marketing';
  if (['customer-service','support-tickets'].includes(first)) return 'support';
  if (['studio','trend','live'].includes(first)) return 'marketing';
  if (first === 'store-customizer') return 'settings';
  return 'dashboard';
};

const actionForPath = (path) => {
  const clean = String(path || '/').replace(/^\//, '');
  if (clean === 'products/add') return 'create';
  if (clean.startsWith('products/edit/')) return 'edit';
  return 'view';
};

export const canAccess = (user, path, action = actionForPath(path)) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'staff') return false;
  const role = user.staffRole || 'viewer';
  if (role === 'super_admin') return true;
  const moduleName = moduleForPath(path);
  const custom = user.staffPermissions?.[moduleName];
  if (custom && typeof custom === 'object' && Object.prototype.hasOwnProperty.call(custom, action)) return custom[action] === true;
  const defaults = roleDefaults[role] || {};
  if (defaults.allView) return action === 'view';
  return Array.isArray(defaults[moduleName]) && defaults[moduleName].includes(action);
};

export { moduleForPath, actionForPath };
