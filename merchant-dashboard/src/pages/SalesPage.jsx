import React, { useEffect, useState } from 'react';
import api from '../api/client';

const PAGE_SIZE = 20;
const money = (value) => `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ total: 0, myTotal: 0, myCommission: 0, myNet: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    api.get('/orders/merchant/sales', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (!alive) return;
        const nextPages = Number(data.pages || 0);
        setOrders(data.orders || []);
        setSummary({
          total: Number(data.total || 0),
          myTotal: Number(data.totals?.myTotal || 0),
          myCommission: Number(data.totals?.myCommission || 0),
          myNet: Number(data.totals?.myNet || 0),
        });
        setPages(nextPages);
        if (nextPages > 0 && page > nextPages) setPage(nextPages);
        if (nextPages === 0 && page !== 1) setPage(1);
      })
      .catch((e) => {
        if (alive) setError(e?.response?.data?.message || 'تعذر تحميل المبيعات');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [page]);

  return (
    <div className="merchant-page sales-page" dir="rtl">
      <header className="merchant-page-hero">
        <div><span className="page-kicker">MYBRAND · PERFORMANCE</span><h1>المبيعات</h1><p>تابع حركة مبيعاتك والعمولة وصافي المستحق من مكان واحد.</p></div>
        <div className="page-hero-badge"><span>↗</span><small>{summary.total.toLocaleString('ar-EG')} طلب</small></div>
      </header>

      {error && <div className="page-alert error">{error}</div>}
      <section className="page-stat-grid" aria-label="ملخص المبيعات">
        <SummaryCard label="إجمالي المبيعات" value={money(summary.myTotal)} icon="▤" />
        <SummaryCard label="إجمالي عمولة MYBRAND" value={money(summary.myCommission)} icon="٪" />
        <SummaryCard label="صافي المستحق لك" value={money(summary.myNet)} accent icon="✓" />
      </section>

      <section className="page-panel">
        <div className="panel-head"><div><span className="page-kicker">ORDERS</span><h2>تفاصيل المبيعات</h2></div><span className="panel-count">{summary.total.toLocaleString('ar-EG')} عملية</span></div>
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
        <Pagination page={page} pages={pages} onChange={setPage} disabled={loading} />
      </section>
    </div>
  );
}

function Pagination({ page, pages, onChange, disabled }) {
  if (pages <= 1) return null;
  return (
    <div className="sales-pagination" aria-label="تنقل صفحات المبيعات">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={disabled || page <= 1}>السابق</button>
      <span>صفحة {page.toLocaleString('ar-EG')} من {pages.toLocaleString('ar-EG')}</span>
      <button type="button" onClick={() => onChange(Math.min(pages, page + 1))} disabled={disabled || page >= pages}>التالي</button>
    </div>
  );
}

function SummaryCard({ label, value, icon, accent }) {
  return <article className={`page-stat-card ${accent ? 'accent' : ''}`}><span className="page-stat-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>;
}
