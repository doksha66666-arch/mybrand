import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './DashboardPage.css';

const money = n => `${Number(n || 0).toLocaleString('ar-EG')} ج.م`;
const num = n => Number(n || 0).toLocaleString('ar-EG');

export default function DashboardPage(){
  const [stats,setStats]=useState({sales:0,orders:0,customers:0,avg:0});
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);

  useEffect(()=>{ let live=true; (async()=>{try{
    const [summary,customers,orderList]=await Promise.allSettled([
      api.get('/orders/stats/summary'), api.get('/customers'), api.get('/orders',{params:{limit:5}})
    ]);
    if(!live)return;
    const s=summary.status==='fulfilled' ? summary.value.data||{} : {};
    const c=customers.status==='fulfilled' ? customers.value.data||{} : {};
    const o=orderList.status==='fulfilled' ? orderList.value.data||{} : {};
    const sales=Number(s.totalSales??s.sales??0);
    const count=Number(s.ordersCount??s.totalOrders??0);
    const customerCount=Number(c.total??c.count??0);
    const avg=Number(s.averageOrder??s.avgOrder??(count ? sales/count : 0));
    setStats({sales,orders:count,customers:customerCount,avg});
    const rows=o.orders??o.data;
    if(Array.isArray(rows)) setOrders(rows.slice(0,5).map(x=>({
      id:x.orderNumber||x._id||'', customer:x.customer?.name||x.customerName||'',
      merchant:x.merchant?.name||x.merchantName||'', amount:x.total??x.amount??0,
      status:x.status||''
    })));
    setError(summary.status==='rejected' && customers.status==='rejected' && orderList.status==='rejected');
  }catch{if(live)setError(true)}finally{if(live)setLoading(false)}})(); return()=>{live=false}},[]);

  return <div className="dashboard-page" dir="rtl">
    <div className="dash-head"><div><div className="eyebrow">MYBRAND CONTROL CENTER</div><h1>لوحة تحكم MYBRAND</h1><p>بيانات المنصة الحقيقية فقط.</p></div><div className="dash-head-actions"><button className="dash-search" onClick={()=>window.dispatchEvent(new Event('open-admin-command-center'))}>⌕ <span>بحث في لوحة التحكم</span></button><button className="primary-action" onClick={()=>window.location.href='/products'}>+ إضافة منتج</button><button className="secondary-action" onClick={()=>window.location.href='/categories'}>+ إضافة قسم</button></div></div>
    <section className="kpi-grid">
      <article className="kpi"><div className="kpi-top"><span className="kpi-icon red">↗</span></div><strong>{loading?'—':money(stats.sales)}</strong><span>إجمالي المبيعات</span><small>من قاعدة البيانات</small></article>
      <article className="kpi"><div className="kpi-top"><span className="kpi-icon blue">▣</span></div><strong>{loading?'—':num(stats.orders)}</strong><span>إجمالي الطلبات</span><small>من قاعدة البيانات</small></article>
      <article className="kpi"><div className="kpi-top"><span className="kpi-icon green">♙</span></div><strong>{loading?'—':num(stats.customers)}</strong><span>العملاء</span><small>من قاعدة البيانات</small></article>
      <article className="kpi"><div className="kpi-top"><span className="kpi-icon orange">◈</span></div><strong>{loading?'—':money(stats.avg)}</strong><span>متوسط قيمة الطلب</span><small>محسوب من البيانات الحقيقية</small></article>
    </section>
    <div className="dash-two">
      <section className="card sales-card"><div className="card-head"><div><h2>المبيعات خلال الفترة</h2><p>يتم عرض البيانات المتاحة من النظام فقط.</p></div></div><div className="chart"><div className="chart-grid"><i/><i/><i/><i/></div><div className="empty-dashboard-state">لا توجد بيانات مبيعات كافية للعرض حاليًا.</div></div></section>
      <section className="card category-card"><div className="card-head"><div><h2>المبيعات حسب القسم</h2><p>توزيع الإيرادات الحقيقي.</p></div></div><div className="donut-area"><div className="donut"><div><b>0%</b><span>لا توجد بيانات</span></div></div><div className="legend"><div className="empty-dashboard-state">لا توجد بيانات أقسام متاحة حاليًا.</div></div></div></section>
    </div>
    <div className="dash-two lower">
      <section className="card orders-card"><div className="card-head"><div><h2>أحدث الطلبات</h2><p>الطلبات الحقيقية فقط.</p></div><button className="text-btn" onClick={()=>window.location.href='/orders'}>عرض كل الطلبات ←</button></div><div className="table-scroll"><table><thead><tr><th>الطلب</th><th>العميل</th><th>التاجر</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody>{orders.length ? orders.map((o,i)=><tr key={o.id||i}><td><b>{o.id}</b></td><td>{o.customer}</td><td>{o.merchant}</td><td><b>{money(o.amount)}</b></td><td>{o.status}</td></tr>) : <tr><td colSpan="5" className="empty-dashboard-state">لا توجد طلبات حقيقية لعرضها.</td></tr>}</tbody></table></div></section>
      <section className="card best-card"><div className="card-head"><div><h2>الأكثر مبيعًا</h2><p>يعرض عند توفر بيانات حقيقية.</p></div><button className="text-btn" onClick={()=>window.location.href='/products'}>المنتجات ←</button></div><div className="best-list"><div className="empty-dashboard-state">لا توجد بيانات منتجات مباعة كافية للعرض.</div></div></section>
    </div>
    <section className="quick-row"><div><span className="quick-icon">✓</span><div><b>حالة البيانات</b><small>{error?'تعذر تحميل بعض بيانات النظام':'يتم استخدام البيانات الحقيقية فقط'}</small></div><em>{error?'تنبيه':'متصل'}</em></div><div><span className="quick-icon blue-bg">◷</span><div><b>الطلبات</b><small>إدارة الطلبات من الصفحة المخصصة</small></div><button onClick={()=>window.location.href='/orders'}>مراجعة ←</button></div><div><span className="quick-icon orange-bg">!</span><div><b>المنتجات</b><small>إدارة المنتجات والأقسام من لوحة التحكم</small></div><button onClick={()=>window.location.href='/products'}>فتح ←</button></div></section>
  </div>;
}
