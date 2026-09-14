import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Icon({ type }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'home') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
  if (type === 'grid') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
  if (type === 'trend') return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>;
  if (type === 'cart') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M3 4h2l2.4 11.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6"/></svg>;
  if (type === 'user') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>;
  return null;
}

const navItems = [
  ['/', 'home', 'الرئيسية'],
  ['/categories', 'grid', 'الأقسام'],
  ['/trend', 'trend', 'الترند'],
  ['/cart', 'cart', 'السلة'],
];

export default function BottomNav() {
  const location = useLocation();
  const { itemsCount } = useCart();
  const { user } = useAuth();

  // الصفحة الرئيسية لديها الشريط الأصلي داخل HomePage، لذلك لا نكرر الشريط هنا.
  if (location.pathname === '/') return null;

  return <nav className="bottom-nav" aria-label="التنقل الرئيسي">
    {navItems.map(([to, icon, label]) => {
      const active = to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`);
      const isTrend = to === '/trend';
      const isCart = to === '/cart';
      return <Link key={to} to={to} className={`nav-item${active ? ' active' : ''}${isTrend ? ' trend' : ''}${isCart ? ' cart' : ''}`} aria-current={active ? 'page' : undefined}>
        {isTrend ? <><div className="trend-circle"><Icon type="trend" /></div><span>{label}</span></> : <><Icon type={icon} /><span>{label}</span>{isCart && itemsCount > 0 && <b className="bottom-cart-badge" aria-label={`عدد المنتجات في السلة: ${itemsCount}`}>{itemsCount > 99 ? '99+' : itemsCount}</b>}</>}
      </Link>;
    })}
    <Link to={user ? '/account' : '/login'} className={`nav-item${location.pathname.startsWith('/account') ? ' active' : ''}`} aria-current={location.pathname.startsWith('/account') ? 'page' : undefined}>
      <Icon type="user" /><span>{user ? 'حسابي' : 'دخول'}</span>
    </Link>
  </nav>;
}
