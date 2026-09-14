import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../admin-dashboard/src/context/AdminAuthContext';

const links = [
  ['/admin', 'الرئيسية', '⌂'],
  ['/admin/orders', 'الطلبات', '🛍️'],
  ['/admin/products', 'المنتجات', '📦'],
  ['/admin/categories', 'الأقسام', '▦'],
  ['/admin/customers', 'العملاء', '👤'],
  ['/admin/merchants', 'التجار', '🏪'],
  ['/admin/campaigns', 'الحملات', '🚀'],
  ['/admin/coupons', 'الكوبونات', '🏷️'],
  ['/admin/gift-cards', 'بطاقات الهدايا', '🎁'],
  ['/admin/banners', 'البنرات', '🖼️'],
  ['/admin/loyalty', 'النقاط', '✦'],
  ['/admin/reports', 'التقارير', '▥'],
  ['/admin/payments', 'طرق الدفع', '▣'],
  ['/admin/settings', 'الإعدادات', '⚙'],
];

const shell = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'row',
  background: '#f6f8fb',
  color: '#111827',
  fontFamily: 'Tajawal, Arial, sans-serif',
};

export default function AdminEmbeddedLayout() {
  const { user, logout } = useAdminAuth();

  return (
    <div style={shell} dir="rtl">
      <aside
        style={{
          width: 250,
          flexShrink: 0,
          background: '#0f172a',
          color: '#fff',
          padding: '22px 14px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 22px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#fff', color: '#0f172a', fontWeight: 900, fontSize: 20 }}>M</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>MYBRAND</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>لوحة الأدمن</div>
          </div>
        </div>

        <nav style={{ display: 'grid', gap: 6 }}>
          {links.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 42,
                padding: '0 12px',
                borderRadius: 10,
                color: '#fff',
                textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
                fontWeight: isActive ? 800 : 600,
              })}
            >
              <span style={{ width: 24, textAlign: 'center' }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', marginTop: 22, paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{user?.name || 'أدمن المتجر'}</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 3, direction: 'ltr', textAlign: 'right' }}>{user?.email || 'admin@mybrand.com'}</div>
          <button
            onClick={logout}
            style={{
              marginTop: 12,
              width: '100%',
              border: 0,
              borderRadius: 9,
              height: 40,
              cursor: 'pointer',
              background: '#fff',
              color: '#0f172a',
              fontWeight: 800,
            }}
          >
            خروج
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: 24 }}>
        <div style={{ maxWidth: 1500, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
