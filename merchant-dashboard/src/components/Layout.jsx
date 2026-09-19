import React, { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import './MerchantLayout.css';
import './MerchantPages.css';

const paths = {
  home: 'M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z M9 20v-5.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V20',
  products: 'M6 4.5h12A1.5 1.5 0 0 1 19.5 6v12A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5z M8 8h3v3H8z M13 8h3v3h-3z M8 13h3v3H8z M13 13h3v3h-3z',
  orders: 'M6 7.5h12l1.2 11H4.8z M9 7.5a3 3 0 0 1 6 0 M8 12h8',
  sales: 'M5 18 9.5 13.5 12.5 16.5 19 10 M14.5 10H19v4.5',
  commission: 'M7.5 4.5h9A1.5 1.5 0 0 1 18 6v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18V6a1.5 1.5 0 0 1 1.5-1.5z M9 9h6 M9 12h6 M9 15h3.5',
  studio: 'M12 3.8 13.8 8l4.4.2-3.4 2.8 1.1 4.2-3.9-2.3-3.9 2.3 1.1-4.2-3.4-2.8 4.4-.2z',
  profile: 'M12 12.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2z M5.5 19.5a6.5 6.5 0 0 1 13 0',
  store: 'M4 10h16l-1.2 10H5.2z M7 10V6.5A2.5 2.5 0 0 1 9.5 4h5A2.5 2.5 0 0 1 17 6.5V10 M8 14h8',
  logout: 'M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10 M13 8l4 4-4 4 M17 12H9',
};

function Icon({ name, size = 19, strokeWidth = 1.9 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.home} /></svg>;
}

const links = [
  { to: '/', label: 'الرئيسية', icon: 'home', end: true, group: 'تشغيل المتجر' },
  { to: '/products', label: 'المنتجات', icon: 'products', group: 'تشغيل المتجر' },
  { to: '/store-customizer', label: 'تخصيص المتجر', icon: 'store', group: 'تشغيل المتجر' },
  { to: '/orders', label: 'الطلبات', icon: 'orders', group: 'تشغيل المتجر' },
  { to: '/sales', label: 'المبيعات', icon: 'sales', group: 'المال والأداء' },
  { to: '/commission', label: 'العمولة والمستحقات', icon: 'commission', group: 'المال والأداء' },
  { to: '/studio', label: 'استديو المحتوى', icon: 'studio', group: 'النمو', badge: 'جديد' },
  { to: '/profile', label: 'بيانات المتجر', icon: 'profile', group: 'الحساب' },
];

function NavItem({ link, compact = false }) {
  return (
    <NavLink to={link.to} end={link.end} title={compact ? link.label : undefined} className={({ isActive }) => `merchant-nav-link ${isActive ? 'active' : ''}`}>
      <span className="nav-icon"><Icon name={link.icon} /></span>
      {!compact && <span className="nav-label">{link.label}</span>}
      {!compact && link.badge && <b className="nav-hot">{link.badge}</b>}
    </NavLink>
  );
}

export default function Layout() {
  const { user, merchant, logout } = useMerchantAuth();
  const [collapsed, setCollapsed] = useState(false);
  const firstLetter = (merchant?.businessName || 'M').slice(0, 1).toUpperCase();
  const groups = useMemo(() => [...new Set(links.map((item) => item.group))], []);
  const status = merchant?.status;
  const statusText = status === 'suspended'
    ? `حسابك موقوف حاليًا. ${merchant.suspensionReason ? `السبب: ${merchant.suspensionReason}` : 'تواصل مع الإدارة.'}`
    : status === 'approved'
      ? 'متجرك معتمد ويمكنك إدارة المنتجات والطلبات والمحتوى.'
      : 'حسابك قيد الاعتماد. بعض وظائف النشر قد تبقى مقيدة حتى اعتماد الحساب.';

  return (
    <div className={`merchant-shell ${collapsed ? 'sidebar-collapsed' : ''}`} dir="rtl">
      <aside className="merchant-sidebar" aria-label="قائمة التاجر">
        <div className="sidebar-brand-row">
          <NavLink to="/" end className="header-brand" aria-label="MYBRAND">
            <span className="header-mark">MY</span>
            {!collapsed && <span><strong>MYBRAND</strong><small>MERCHANT HUB</small></span>}
          </NavLink>
          <button className="sidebar-toggle" type="button" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}>{collapsed ? '‹' : '›'}</button>
        </div>

        <div className="sidebar-store-card">
          <span className="top-avatar">{firstLetter}</span>
          {!collapsed && <div><strong>{merchant?.businessName || 'متجري'}</strong><small>{merchant?.storeName || 'متجر MYBRAND'}</small></div>}
        </div>

        <nav className="merchant-nav-vertical">
          {groups.map((group) => (
            <div className="nav-group" key={group}>
              {!collapsed && <span className="nav-group-title">{group}</span>}
              {links.filter((link) => link.group === group).map((link) => <NavItem key={link.to} link={link} compact={collapsed} />)}
            </div>
          ))}
        </nav>

        <button className="sidebar-logout" type="button" onClick={logout} title="تسجيل الخروج"><Icon name="logout" size={18} />{!collapsed && <span>تسجيل الخروج</span>}</button>
      </aside>

      <div className="merchant-workspace">
        <header className="merchant-header">
          <div className="merchant-header-main">
            <div className="mobile-brand"><span className="header-mark">MY</span><span><strong>MYBRAND</strong><small>MERCHANT HUB</small></span></div>
            <div className="header-context"><span>لوحة التاجر</span><b>/</b><strong>{merchant?.businessName || 'متجري'}</strong></div>
            <div className="header-account">
              <span className="top-status"><i /> متصل</span>
              <div className="header-account-info"><span>{merchant?.businessName || 'متجري'}</span><small>{merchant?.storeName || 'متجر MYBRAND'}</small></div>
              <span className="top-avatar">{firstLetter}</span>
              <button className="header-logout" type="button" onClick={logout} title="تسجيل الخروج" aria-label="تسجيل الخروج"><Icon name="logout" size={17} /></button>
            </div>
          </div>
        </header>

        {status !== 'approved' && (
          <div className={`merchant-notice ${status === 'suspended' ? 'danger' : 'warning'}`}>
            <span>{status === 'suspended' ? '!' : 'i'}</span>
            <div><strong>{status === 'suspended' ? 'الحساب موقوف' : 'حالة الحساب'}</strong><p>{statusText}</p></div>
          </div>
        )}

        <main className="merchant-main">
          <section className="merchant-content"><Outlet /></section>
        </main>

        <nav className="mobile-bottom-nav" aria-label="تنقل سريع">
          {links.slice(0, 5).map((link) => <NavItem key={link.to} link={link} />)}
        </nav>
        <small className="merchant-footer-email">{user?.email}</small>
      </div>
    </div>
  );
}
