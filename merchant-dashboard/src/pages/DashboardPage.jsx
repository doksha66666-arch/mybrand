import React from 'react';
import { Link } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';

const money = (value) => `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;

export default function DashboardPage() {
  const { merchant, stats } = useMerchantAuth();
  if (!stats) return <div className="merchant-loading-card">جارٍ تجهيز لوحة متجرك…</div>;

  const cards = [
    { label: 'إجمالي المبيعات', value: money(stats.totalSales), icon: '↗', tone: 'blue' },
    { label: 'الطلبات', value: Number(stats.ordersCount || 0).toLocaleString('ar-EG'), icon: '🛍', tone: 'purple' },
    { label: 'المنتجات', value: Number(stats.productsCount || 0).toLocaleString('ar-EG'), icon: '▦', tone: 'orange' },
    { label: 'قيد المراجعة', value: Number(stats.pendingProductsCount || 0).toLocaleString('ar-EG'), icon: '⌁', tone: 'pink', warn: stats.pendingProductsCount > 0 },
    { label: 'عمولة MYBRAND', value: money(stats.totalCommission), icon: '٪', tone: 'gold' },
    { label: 'صافي المستحق', value: money(stats.totalMerchantAmount), icon: '✓', tone: 'green', accent: true },
  ];

  return (
    <div className="merchant-dashboard-page">
      <section className="welcome-hero">
        <div className="welcome-copy">
          <span className="hero-kicker">MYBRAND • MERCHANT HUB</span>
          <h1>أهلاً {merchant?.businessName || 'بك'} 👋</h1>
          <p>كل أرقام متجرك قدامك. تابع المبيعات، جهّز الطلبات وانشر محتواك في ثواني.</p>
          <div className="hero-actions"><Link to="/products" className="hero-primary">＋ أضف منتجًا</Link><Link to="/studio/trend" className="hero-secondary">✦ انشر محتوى</Link></div>
        </div>
        <div className="hero-orbit"><div className="hero-orbit-core">MY</div><span className="orbit-chip chip-a">+ مبيعات</span><span className="orbit-chip chip-b">🔥 ترند</span><span className="orbit-chip chip-c">✓ جاهز</span></div>
      </section>

      <section className="dashboard-section-head"><div><span className="section-kicker">OVERVIEW</span><h2>نبض المتجر اليوم</h2></div><span className="updated-badge"><i /> آخر تحديث الآن</span></section>
      <section className="stat-grid" aria-label="إحصائيات المتجر">
        {cards.map((card) => <article key={card.label} className={`dash-stat-card ${card.tone} ${card.accent ? 'accent' : ''}`}><div className="stat-icon">{card.icon}</div><div><p>{card.label}</p><strong className={card.warn ? 'warn' : ''}>{card.value}</strong></div><span className="stat-sheen" /></article>)}
      </section>

      <section className="quick-grid">
        <Link to="/orders" className="quick-card quick-orders"><span className="quick-emoji">🛍</span><div><small>تشغيل</small><h3>راجع طلباتك</h3><p>ابدأ بالتجهيز والتنفيذ.</p></div><b>←</b></Link>
        <Link to="/studio" className="quick-card quick-studio"><span className="quick-emoji">✦</span><div><small>محتوى</small><h3>خلي متجرك ظاهر</h3><p>ريلز ومنشورات مباشرة من الاستديو.</p></div><b>←</b></Link>
        <Link to="/sales" className="quick-card quick-sales"><span className="quick-emoji">↗</span><div><small>أداء</small><h3>شوف أرباحك</h3><p>تابع صافي المستحق والعمولة.</p></div><b>←</b></Link>
      </section>

      <section className="dashboard-tip"><div className="tip-icon">💡</div><div><strong>نصيحة اليوم</strong><p>أضف صور واضحة وحدّث المخزون باستمرار، ثم استخدم استديو المحتوى لعرض منتجاتك على جمهور MYBRAND.</p></div><Link to="/profile">تعديل البروفايل</Link></section>
    </div>
  );
}
