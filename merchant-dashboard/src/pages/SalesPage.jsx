import React, { useEffect, useState } from 'react';
import api from '../api/client';

const money = (value) => `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/orders/merchant/mine')
      .then(({ data }) => { if (alive) setOrders(data.orders || []); })
      .catch((e) => { if (alive) setError(e?.response?.data?.message || 'تعذر تحميل المبيعات'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const totals = orders.reduce((acc, o) => ({
    total: acc.total + Number(o.myTotal || 0),
    commission: acc.commission + Number(o.myCommission || 0),
    net: acc.net + Number(o.myNet || 0),
  }), { total: 0, commission: 0, net: 0 });

  return (
    <div className="merchant-page sales-page" dir="rtl">
      <header className="merchant-page-hero">
        <div><span className="page-kicker">MYBRAND · PERFORMANCE</span><h1>المبيعات</h1><p>تابع حركة مبيعاتك والعمولة وصافي المستحق من مكان واحد.</p></div>
        <div className="page-hero-badge"><span>↗</span><small>{orders.length.toLocaleString('ar-EG')} طلب</small></div>
      </header>

      {error && <div className="page-alert error">{error}</div>}
      <section className="page-stat-grid" aria-label="ملخص المبيعات">
        <SummaryCard label="إجمالي المبيعات" value={money(totals.total)} icon="▤" />
        <SummaryCard label="إجمالي عمولة MYBRAND" value={money(totals.commission)} icon="٪" />
        <SummaryCard label="صافي المستحق لك" value={money(totals.net)} accent icon="✓" />
      </section>

      <section className="page-panel">
        <div className="panel-head"><div><span className="page-kicker">ORDERS</span><h2>تفاصيل المبيعات</h2></div><span className="panel-count">{orders.length.toLocaleString('ar-EG')} عملية</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>رقم الطلب</th><th>المبيعات</th><th>عمولة MYBRAND</th><th>صافي مستحقك</th></tr></thead>
            <tbody>
              {orders.map((o) => <tr key={o._id}><td><strong>#{o.orderNumber}</strong></td><td>{money(o.myTotal)}</td><td>{money(o.myCommission)}</td><td className="money-accent">{money(o.myNet)}</td></tr>)}
              {!loading && orders.length === 0 && <tr><td colSpan={4} className="empty-cell">لا توجد مبيعات بعد</td></tr>}
              {loading && <tr><td colSpan={4} className="empty-cell">جارٍ تحميل المبيعات...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, icon, accent }) {
  return <article className={`page-stat-card ${accent ? 'accent' : ''}`}><span className="page-stat-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>;
}
