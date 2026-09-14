import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import './MerchantLayout.css';
import './MerchantPages.css';
import '../pages/MerchantOrdersMobile.css';

const paths = {
  home: 'M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z M9 20v-5.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V20',
  products: 'M6 4.5h12A1.5 1.5 0 0 1 19.5 6v12A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5z M8 8h3v3H8z M13 8h3v3h-3z M8 13h3v3H8z M13 13h3v3h-3z',
  orders: 'M6 7.5h12l1.2 11H4.8z M9 7.5a3 3 0 0 1 6 0 M8 12h8',
  sales: 'M5 18 9.5 13.5 12.5 16.5 19 10 M14.5 10H19v4.5',
  commission: 'M7.5 4.5h9A1.5 1.5 0 0 1 18 6v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18V6A1.5 1.5 0 0 1 7.5 4.5z M9 9h6 M9 12h6 M9 15h3.5',
  studio: 'M12 3.8 13.8 8l4.4.2-3.4 2.8 1.1 4.2-3.9-2.3-3.9 2.3 1.1-4.2-3.4-2.8 4.4-.2z',
  profile: 'M12 12.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2z M5.5 19.5a6.5 6.5 0 0 1 13 0',
  logout: 'M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10 M13 8l4 4-4 4 M17 12H9',
};

function Icon({ name, size = 19, strokeWidth = 1.9 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.home} /></svg>;
}

const links = [
  { to: '/', label: 'الرئيسية', icon: 'home', end: true },
  { to: '/products', label: 'المنتجات', icon: 'products' },
  { to: '/orders', label: 'الطلبات', icon: 'orders' },
  { to: '/sales', label: 'المبيعات', icon: 'sales' },
  { to: '/commission', label: 'العمولة', icon: 'commission' },
  { to: '/studio', label: 'استديو المحتوى', icon: 'studio' },
  { to: '/profile', label: 'البروفايل', icon: 'profile' },
];

export default function Layout() {
  const { user, merchant, logout } = useMerchantAuth();
  const firstLetter = (merchant?.businessName || 'M').slice(0, 1).toUpperCase();
  const statusText = merchant?.status === 'suspended'
    ? `حسابك موقوف حاليًا. ${merchant.suspensionReason ? `السبب: ${merchant.suspensionReason}` : 'تواصل مع الإدارة.'}`
    : 'حسابك قيد الاعتماد. نشر محتوى الاستديو يتم مباشرة حسب صلاحيات حسابك.';

  return (
    <div className="merchant-shell" dir="rtl">
      <header className="merchant-header">
        <div className="merchant-header-main">
          <NavLink to="/" end className="header-brand" aria-label="MYBRAND">
            <span className="header-mark">MY</span>
            <span><strong>MYBRAND</strong><small>MERCHANT HUB</small></span>
          </NavLink>

          <nav className="merchant-nav merchant-nav-horizontal" aria-label="القائمة الرئيسية">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `merchant-nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><Icon name={link.icon} /></span>
                <span className="nav-label">{link.label}</span>
                {link.to === '/studio' && <b className="nav-hot">جديد</b>}
              </NavLink>
            ))}
          </nav>

          <div className="header-account">
            <div className="header-account-info"><span>{merchant?.businessName || 'متجري'}</span><small>{merchant?.storeName || 'متجر MYBRAND'}</small></div>
            <span className="top-status"><i /> متصل</span>
            <span className="top-avatar">{firstLetter}</span>
            <button className="header-logout" type="button" onClick={logout} title="تسجيل الخروج" aria-label="تسجيل الخروج"><Icon name="logout" size={17} /></button>
          </div>
        </div>
      </header>

      {merchant?.status !== 'approved' && (
        <div className={`merchant-notice ${merchant?.status === 'suspended' ? 'danger' : 'warning'}`}>
          <span>{merchant?.status === 'suspended' ? '!' : 'i'}</span>
          <div><strong>{merchant?.status === 'suspended' ? 'الحساب موقوف' : 'معلومة مهمة'}</strong><p>{statusText}</p></div>
        </div>
      )}

      <main className="merchant-main">
        <div className="merchant-page-bar">
          <span>لوحة التاجر</span><b>/</b><strong>{merchant?.businessName || 'متجري'}</strong>
        </div>
        <section className="merchant-content"><Outlet /></section>
      </main>

      <nav className="mobile-bottom-nav" aria-label="تنقل سريع">
        {links.slice(0, 5).map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? 'active' : ''}>
            <span><Icon name={link.icon} size={19} /></span><small>{link.label}</small>
          </NavLink>
        ))}
      </nav>

      <small className="merchant-footer-email">{user?.email}</small>
    </div>
  );
}
