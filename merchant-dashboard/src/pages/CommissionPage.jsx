import React from 'react';
import { useMerchantAuth } from '../context/MerchantAuthContext';

const money = (value) => `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;

export default function CommissionPage() {
  const { merchant, stats } = useMerchantAuth();
  const rate = Number(merchant?.commissionRate || 0);

  return (
    <div className="merchant-page commission-page" dir="rtl">
      <header className="merchant-page-hero">
        <div><span className="page-kicker">MYBRAND · PAYOUTS</span><h1>العمولة</h1><p>اعرف نسبة العمولة الحالية وتأثيرها على صافي مستحقاتك.</p></div>
        <div className="rate-orb"><span>{rate}%</span><small>النسبة الحالية</small></div>
      </header>

      <section className="commission-main-card">
        <div className="commission-rate"><span className="mini-label">نسبة عمولة MYBRAND الحالية</span><strong>{rate}%</strong></div>
        <div className="commission-copy"><strong>النسبة تُدار من فريق MYBRAND</strong><p>لا تحتاج لتعديل أي إعدادات. يتم احتساب العمولة تلقائيًا ضمن كل عملية بيع.</p></div>
      </section>

      {stats && <section className="page-stat-grid">
        <Stat label="إجمالي المبيعات" value={money(stats.totalSales)} icon="▤" />
        <Stat label="إجمالي العمولة المخصومة" value={money(stats.totalCommission)} icon="٪" />
        <Stat label="صافي ما استحققته" value={money(stats.totalMerchantAmount)} accent icon="✓" />
      </section>}
    </div>
  );
}

function Stat({ label, value, icon, accent }) {
  return <article className={`page-stat-card ${accent ? 'accent' : ''}`}><span className="page-stat-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>;
}
