import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const money = (value) => `${Number(value || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`;
const number = (value) => Number(value || 0).toLocaleString('ar-EG');
const dateLabel = (value) => {
  if (!value) return '—';
  const text = String(value).slice(0, 10);
  return text.split('-').reverse().join('/');
};

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [summary, dailyResult] = await Promise.all([
        api.get('/orders/reports/summary'),
        api.get('/orders/reports/daily'),
      ]);
      setStats(summary.data || {});
      setDailyReports(dailyResult.data?.reports || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل التقارير من البيانات الفعلية.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const maxDailySales = useMemo(
    () => Math.max(...(stats?.salesByDay || []).map((row) => Number(row.sales || 0)), 1),
    [stats]
  );

  return (
    <section className="reports-admin" dir="rtl">
      <style>{css}</style>
      <div className="crumb">النظام <b>التقارير</b></div>
      <header className="header">
        <div>
          <div className="eyebrow">MYBRAND INSIGHTS</div>
          <h1>التقارير</h1>
          <p>مؤشرات وتحليلات محسوبة مباشرة من بيانات MYBRAND الفعلية.</p>
        </div>
        <button className="refresh" onClick={() => load(true)} disabled={loading || refreshing}>
          {refreshing ? 'جارٍ التحديث…' : '↻ تحديث البيانات'}
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="cards">
        <div><b>إجمالي المبيعات</b><strong>{loading ? '—' : money(stats?.totalSales)}</strong><span>الطلبات غير الملغاة</span></div>
        <div><b>إجمالي الطلبات</b><strong>{loading ? '—' : number(stats?.ordersCount)}</strong><span>من سجل الطلبات الفعلي</span></div>
        <div><b>متوسط قيمة الطلب</b><strong>{loading ? '—' : money(stats?.averageOrder)}</strong><span>متوسط الطلبات غير الملغاة</span></div>
        <div><b>العملاء</b><strong>{loading ? '—' : number(stats?.customersCount)}</strong><span>إجمالي حسابات العملاء</span></div>
      </div>

      <div className="grid two">
        <div className="panel">
          <div className="panel-head"><div><h2>المبيعات خلال آخر 7 أيام</h2><p>قيمة الطلبات غير الملغاة لكل يوم.</p></div></div>
          <div className="chart">
            {(stats?.salesByDay || []).length ? stats.salesByDay.map((row) => (
              <div className="bar-wrap" key={row.date}>
                <span>{money(row.sales)}</span>
                <div className="bar" style={{ height: `${Math.max(8, Number(row.sales || 0) / maxDailySales * 180)}px` }} />
                <small>{row.date.slice(5)}</small>
              </div>
            )) : <div className="empty">لا توجد مبيعات خلال الفترة المحددة.</div>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h2>المبيعات حسب القسم</h2><p>أعلى الأقسام من واقع الطلبات المباعة.</p></div></div>
          <div className="rank-list">
            {(stats?.categorySales || []).length ? stats.categorySales.map((row, index) => {
              const total = Math.max((stats.categorySales || []).reduce((sum, item) => sum + Number(item.sales || 0), 0), 1);
              return <div className="rank-row" key={`${row.name}-${index}`}><div className="rank-top"><b>{row.name}</b><span>{money(row.sales)}</span></div><div className="track"><i style={{ width: `${Math.max(3, Number(row.sales || 0) / total * 100)}%` }} /></div></div>;
            }) : <div className="empty">لا توجد بيانات أقسام مباعة حاليًا.</div>}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <div className="panel-head"><div><h2>الأكثر مبيعًا</h2><p>ترتيب المنتجات بحسب الوحدات المباعة.</p></div></div>
          <div className="product-list">
            {(stats?.topProducts || []).length ? stats.topProducts.map((row, index) => (
              <div className="product-row" key={`${row.name}-${index}`}><span className="badge">#{index + 1}</span><div><b>{row.name || 'منتج'}</b><small>{number(row.units)} وحدة</small></div><strong>{money(row.sales)}</strong></div>
            )) : <div className="empty">لا توجد بيانات مبيعات منتجات حاليًا.</div>}
          </div>
        </div>

        <div className="panel insight">
          <div className="panel-head"><div><h2>قراءة سريعة</h2><p>ملخص مبني على نفس البيانات الظاهرة أعلاه.</p></div></div>
          <div className="insight-box">
            <div><span>المبيعات</span><b>{loading ? '—' : money(stats?.totalSales)}</b></div>
            <div><span>الطلبات</span><b>{loading ? '—' : number(stats?.ordersCount)}</b></div>
            <div><span>متوسط الطلب</span><b>{loading ? '—' : money(stats?.averageOrder)}</b></div>
            <div><span>أفضل منتج</span><b>{stats?.topProducts?.[0]?.name || 'لا توجد بيانات'}</b></div>
          </div>
        </div>
      </div>

      <div className="panel history">
        <div className="panel-head"><div><h2>سجل التقارير اليومية</h2><p>التقارير المؤرشفة والملخصات اليومية المحفوظة في النظام.</p></div><span className="history-count">{loading ? '—' : `${number(dailyReports.length)} تقرير`}</span></div>
        {dailyReports.length ? (
          <div className="history-table-wrap">
            <table>
              <thead><tr><th>التاريخ</th><th>الطلبات</th><th>المبيعات</th><th>الخصومات</th><th>الشحن</th><th>الحالة</th></tr></thead>
              <tbody>
                {dailyReports.slice(0, 12).map((report, index) => (
                  <tr key={`${report.reportDate}-${index}`}>
                    <td>{dateLabel(report.reportDate)}</td>
                    <td>{number(report.orderCount)}</td>
                    <td>{money(report.totalSales)}</td>
                    <td>{money(report.totalDiscount)}</td>
                    <td>{money(report.totalShipping)}</td>
                    <td><span className={`status status-${String(report.status || '').toLowerCase()}`}>{report.status || 'مُنشأ'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty history-empty">لا توجد تقارير يومية مؤرشفة حتى الآن.</div>}
      </div>
    </section>
  );
}

const css = `
.reports-admin{padding:28px;min-height:100%;background:#F6F7FB;color:#111827;font-family:Tajawal}.crumb{font-size:12px;color:#98A2B3}.crumb b{color:#111827;margin-right:7px}.header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin:10px 0 20px}.eyebrow{font-size:11px;font-weight:900;letter-spacing:2px;color:#E60023}.header h1{margin:6px 0 5px;font:900 30px Cairo}.header p{margin:0;color:#667085}.refresh{border:1px solid #D0D5DD;background:#fff;color:#344054;border-radius:12px;padding:10px 14px;font-weight:800;cursor:pointer}.refresh:disabled{opacity:.6;cursor:not-allowed}.error{padding:13px 15px;border-radius:14px;background:#FFF1F3;color:#B42318;border:1px solid #FECDD3;margin-bottom:16px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.cards>div,.panel{background:#fff;border:1px solid #EAECF0;border-radius:18px;padding:20px;box-shadow:0 8px 24px rgba(16,24,40,.05)}.cards b{display:block;color:#667085;font-size:13px}.cards strong{display:block;font:900 28px Cairo;margin:8px 0 2px}.cards span{font-size:11px;color:#98A2B3}.grid{display:grid;gap:15px;margin-top:15px}.grid.two{grid-template-columns:1.25fr 1fr}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.panel h2{margin:0 0 4px;font-size:18px}.panel p{margin:0;color:#667085;font-size:12px}.chart{height:260px;display:flex;align-items:flex-end;gap:10px;padding:8px 4px 0;border-top:1px solid #F2F4F7}.bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:7px;min-width:0}.bar-wrap>span{font-size:9px;color:#667085;white-space:nowrap}.bar{width:min(42px,75%);border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#FF7A18,#FF4D35)}.bar-wrap small{font-size:10px;color:#98A2B3}.rank-list{display:grid;gap:14px}.rank-top{display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:6px}.rank-top span{color:#667085}.track{height:8px;border-radius:99px;background:#EEF1F5;overflow:hidden}.track i{display:block;height:100%;border-radius:99px;background:#E60023}.product-list{display:grid;gap:10px}.product-row{display:grid;grid-template-columns:40px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #F2F4F7}.product-row:last-child{border-bottom:0}.product-row b{display:block;font-size:13px}.product-row small{display:block;margin-top:3px;color:#98A2B3}.product-row strong{font-size:12px}.badge{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#FFF1F2;color:#E60023;font-weight:900}.insight-box{display:grid;grid-template-columns:1fr 1fr;gap:10px}.insight-box div{padding:14px;border-radius:14px;background:#F8FAFC;border:1px solid #EEF2F6}.insight-box span{display:block;color:#667085;font-size:11px}.insight-box b{display:block;margin-top:6px;font-size:18px}.history{margin-top:15px}.history-count{font-size:12px;color:#667085}.history-table-wrap{overflow:auto}.history table{width:100%;border-collapse:collapse;min-width:720px}.history th,.history td{text-align:right;padding:12px 10px;border-bottom:1px solid #F2F4F7;font-size:12px;white-space:nowrap}.history th{color:#667085;font-size:11px;background:#FAFBFC}.history td{font-weight:700}.status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#F2F4F7;color:#475467;font-size:10px}.status-archived,.status-completed{background:#ECFDF3;color:#027A48}.status-pending{background:#FFFAEB;color:#B54708}.history-empty{padding:34px 10px}.empty{color:#667085;text-align:center;padding:45px 10px;font-size:13px;flex:1;align-self:center}@media(max-width:950px){.cards{grid-template-columns:repeat(2,1fr)}.grid.two{grid-template-columns:1fr}}@media(max-width:650px){.reports-admin{padding:16px}.header{display:block}.refresh{margin-top:12px}.cards{grid-template-columns:1fr}.chart{gap:5px}.bar-wrap>span{font-size:8px}.bar-wrap small{font-size:9px}.insight-box{grid-template-columns:1fr}}
`;