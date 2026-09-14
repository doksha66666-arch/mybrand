import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { MERCHANT_DASHBOARD_URL } from '../api/client';
import api from '../api/client';

const merchantStatusLabel = { pending: 'طلب التاجر قيد المراجعة', suspended: 'حساب التاجر موقوف' };
const navItems = [
  ['/', '⌂', 'الرئيسية'],
  ['/categories', '☷', 'الأقسام'],
  ['/trend', '🔥', 'ترند'],
  ['/cart', '🛒', 'السلة'],
];

export default function Header() {
  const { itemsCount } = useCart();
  const { user, merchant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationRef = useRef(null);

  const loadNotifications = async () => {
    if (!user || user.role !== 'customer') return;
    try { const { data } = await api.get('/notifications'); setNotifications(data.notifications || []); setUnreadCount(data.unreadCount || 0); } catch (_) {}
  };
  useEffect(() => { loadNotifications(); if (!user || user.role !== 'customer') return undefined; const timer = window.setInterval(loadNotifications, 20000); return () => window.clearInterval(timer); }, [user?._id, user?.role]);
  const openNotification = async (notification) => { try { if (!notification.isRead) { await api.put(`/notifications/${notification._id}/read`); setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, isRead: true } : item)); setUnreadCount((count) => Math.max(0, count - 1)); } } catch (_) {} setOpenNotifications(false); if (notification.link) navigate(notification.link); };
  const markAllRead = async () => { try { await api.put('/notifications/read-all'); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))); setUnreadCount(0); } catch (_) {} };
  const notificationList = (compact = false) => notifications.length ? notifications.slice(0, compact ? 8 : notifications.length).map((notification) => (<button type="button" key={notification._id} onClick={() => openNotification(notification)} style={{ ...styles.notificationItem, background: notification.isRead ? '#fff' : '#F8FAFC' }}>{notification.image ? <img src={notification.image} alt="" style={styles.notificationImage} /> : <span style={styles.notificationIcon}>✨</span>}<span style={styles.notificationText}><strong>{notification.titleAr}</strong><small>{notification.bodyAr}</small>{!compact && <em>{new Date(notification.createdAt).toLocaleString('ar-EG')}</em>}</span></button>)) : <div style={styles.emptyNotifications}>لا توجد إشعارات جديدة</div>;

  return (<>
    <header style={styles.header}>
      <div className="desktop-header" style={styles.inner}>
        <Link to="/" style={styles.logo}>MYBRAND</Link>
        <nav style={styles.nav}><Link to="/" style={styles.link}>الرئيسية</Link><Link to="/categories" style={styles.link}>الأقسام</Link><Link to="/search" style={styles.link}>بحث</Link><Link to="/wishlist" style={styles.link}>المفضلة</Link><Link to="/orders" style={styles.link}>طلباتي</Link><Link to="/trend" style={styles.trendLink}>🔥 ترند</Link>{user?.role !== 'merchant' && <Link to="/register?type=merchant" style={styles.link}>كن تاجرًا</Link>}</nav>
        <div style={styles.actions}>{user?.role === 'customer' && <div ref={notificationRef} style={styles.notificationWrap}><button type="button" style={styles.notificationBtn} onClick={() => setOpenNotifications((value) => !value)} aria-label="الإشعارات">🔔{unreadCount > 0 && <span style={styles.notificationBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>{openNotifications && <div style={styles.notificationPanel}><div style={styles.notificationHeader}><strong>الإشعارات</strong>{unreadCount > 0 && <button style={styles.markBtn} onClick={markAllRead}>قراءة الكل</button>}</div><div style={styles.notificationList}>{notificationList(false)}</div></div>}</div>}{user?.role === 'merchant' && (merchant?.status === 'approved' ? (MERCHANT_DASHBOARD_URL ? <a href={MERCHANT_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" style={styles.merchantBtn}>🏪 لوحة التاجر</a> : <span style={styles.merchantBadge}>لوحة التاجر غير مهيأة</span>) : (merchant && <span style={styles.merchantBadge}>{merchantStatusLabel[merchant.status]}</span>))}{user ? <><Link to="/account" style={styles.accountBtn}>👤 <span>{user.name}</span></Link><button style={styles.textBtn} onClick={() => { logout(); navigate('/'); }}>خروج</button></> : <button style={styles.textBtn} onClick={() => navigate('/login')}>دخول</button>}<Link to="/cart" style={styles.cartBtn}>🛒 السلة{itemsCount > 0 && <span style={styles.badge}>{itemsCount > 99 ? '99+' : itemsCount}</span>}</Link></div>
      </div>
      <div className="mobile-header"><div className="mobile-topbar"><button className="mobile-icon-btn" onClick={() => navigate('/categories')} aria-label="القائمة">☰</button><Link to="/" className="mobile-logo">MYBRAND</Link>{user?.role === 'customer' && <button className="mobile-icon-btn" onClick={() => setOpenNotifications((value) => !value)} aria-label="الإشعارات">🔔{unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>}<Link to="/cart" className="mobile-icon-btn cart-icon" aria-label="السلة">🛒{itemsCount > 0 && <span>{itemsCount > 99 ? '99+' : itemsCount}</span>}</Link></div>{user?.role === 'customer' && openNotifications && <div style={styles.mobileNotificationPanel}>{notificationList(true)}</div>}<Link to="/search" className="mobile-search"><span>⌕</span> ابحث عن منتج أو قسم أو علامة...</Link></div>
    </header>
    <nav className="mobile-bottom-nav" aria-label="التنقل الرئيسي">
      {navItems.map(([to, icon, label]) => {
        const active = to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`);
        const isTrend = to === '/trend';
        return <Link key={to} to={to} className={`mobile-nav-item${active ? ' is-active' : ''}${isTrend ? ' mobile-nav-trend' : ''}`} aria-current={active ? 'page' : undefined}>
          <span style={to === '/cart' ? { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } : undefined}>{icon}{to === '/cart' && itemsCount > 0 && <b style={{ position: 'absolute', top: -9, right: -10, minWidth: 18, height: 18, padding: '0 4px', border: '2px solid #fff', borderRadius: 999, background: '#E60023', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '800 9px/1 Arial,sans-serif', whiteSpace: 'nowrap', zIndex: 5, pointerEvents: 'none' }}>{itemsCount > 99 ? '99+' : itemsCount}</b>}</span><small>{label}</small>
        </Link>;
      })}
      <Link to={user ? '/account' : '/login'} className={`mobile-nav-item${location.pathname.startsWith('/account') ? ' is-active' : ''}`} aria-current={location.pathname.startsWith('/account') ? 'page' : undefined}>
        <span>♙</span><small>{user ? 'حسابي' : 'دخول'}</small>
      </Link>
    </nav>
  </>);
}

const styles = {
  header: { background: colors.primary, position: 'sticky', top: 0, zIndex: 50 },
  inner: { width: '100%', margin: '0 auto', padding: '14px 3vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  logo: { color: colors.accent, fontWeight: 800, fontSize: 20, letterSpacing: 1, textDecoration: 'none' },
  nav: { display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' },
  link: { color: '#CBD5E1', textDecoration: 'none', fontSize: 14 },
  trendLink: { color: '#FFD23F', textDecoration: 'none', fontSize: 14, fontWeight: 900 },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  accountBtn: { color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,.08)', whiteSpace: 'nowrap' },
  textBtn: { background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: 14 },
  cartBtn: { position: 'relative', background: colors.accent, color: colors.primary, padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' },
  merchantBtn: { background: colors.accent, color: colors.primary, padding: '7px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' },
  merchantBadge: { background: '#334155', color: '#E2E8F0', padding: '6px 10px', borderRadius: 999, fontSize: 11, whiteSpace: 'nowrap' },
  badge: { position: 'absolute', top: -6, left: -6, background: colors.danger, color: '#fff', minWidth: 18, height: 18, padding: '0 4px', borderRadius: '50%', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  notificationWrap: { position: 'relative' },
  notificationBtn: { position: 'relative', width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontSize: 18 },
  notificationBadge: { position: 'absolute', top: -5, left: -5, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: colors.danger, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notificationPanel: { position: 'absolute', top: 46, right: 0, width: 360, background: '#fff', color: '#111827', borderRadius: 16, boxShadow: '0 18px 50px rgba(15,23,42,.2)', overflow: 'hidden', zIndex: 100 },
  notificationHeader: { padding: '14px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB' },
  markBtn: { border: 0, background: 'transparent', color: '#B08D57', cursor: 'pointer', fontSize: 12 },
  notificationList: { maxHeight: 420, overflowY: 'auto' },
  notificationItem: { width: '100%', display: 'flex', gap: 10, textAlign: 'right', padding: 12, border: 0, borderBottom: '1px solid #F1F5F9', cursor: 'pointer', color: '#111827' },
  notificationImage: { width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 },
  notificationIcon: { width: 42, height: 42, borderRadius: 12, background: '#F8F5EF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notificationText: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  emptyNotifications: { padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 },
  mobileNotificationPanel: { position: 'absolute', top: 56, right: 10, left: 10, background: '#fff', borderRadius: 16, boxShadow: '0 18px 50px rgba(15,23,42,.2)', overflow: 'hidden', zIndex: 100, color: '#111827', maxHeight: 420 },
};
