import React,{useEffect,useState}from'react';
import api from '../api/client';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canAccess } from '../utils/permissions';
import './DashboardPage.css';

const money=n=>`${Number(n||0).toLocaleString('ar-EG')} ج.م`;
const num=n=>Number(n||0).toLocaleString('ar-EG');
const orderStatus={pending:'جديد',confirmed:'مؤكد',processing:'قيد التجهيز',shipped:'تم الشحن',delivered:'تم التسليم',cancelled:'ملغي'};
const colors=['#ff4d35','#3267d6','#8a4de8','#16a36a','#ee741e','#0f172a'];

export default function DashboardPage(){
 const{user}=useAdminAuth();
 const canOrders=canAccess(user,'/orders','view');
 const canCustomers=canAccess(user,'/customers','view');
 const canProducts=canAccess(user,'/products','view');
 const canAddProduct=canAccess(user,'/products/add','create');
 const [stats,setStats]=useState({sales:0,orders:0,customers:0,avg:0,salesByDay:[],categorySales:[],topProducts:[]});
 const [orders,setOrders]=useState([]); const[loading,setLoading]=useState(true); const[error,setError]=useState(false);
 useEffect(()=>{let live=true;(async()=>{try{
   const requests=[api.get('/orders/stats/summary'),canCustomers?api.get('/customers',{params:{limit:1}}):null,canOrders?api.get('/orders',{params:{page:1,limit:5,sort:'newest'}}):null].filter(Boolean);
   const results=await Promise.allSettled(requests); if(!live)return;
   const summary=results[0]; let idx=1;
   const customersResult=canCustomers?results[idx++]:null; const orderList=canOrders?results[idx++]:null;
   const s=summary?.status==='fulfilled'?summary.value.data||{}:{};
   const c=customersResult?.status==='fulfilled'?customersResult.value.data||{}:{};
   const o=orderList?.status==='fulfilled'?orderList.value.data||{}:{};
   setStats({sales:Number(s.totalSales||0),orders:Number(s.ordersCount||0),customers:Number(c.total||c.count||0),avg:Number(s.averageOrder||0),salesByDay:Array.isArray(s.salesByDay)?s.salesByDay:[],categorySales:Array.isArray(s.categorySales)?s.categorySales:[],topProducts:Array.isArray(s.topProducts)?s.topProducts:[]});
   const rows=o.orders||o.data||[]; if(canOrders&&Array.isArray(rows))setOrders(rows.slice(0,5).map(x=>({id:x.orderNumber||x._id||'',customer:x.customer?.name||x.customerName||'—',merchant:x.items?.find(i=>i.merchantNameSnapshot)?.merchantNameSnapshot||'—',amount:x.total||0,status:x.status||''})));
   setError(results.some(r=>r?.status==='rejected'));
 }catch{if(live)setError(true)}finally{if(live)setLoading(false)}})();return()=>{live=false}},[canOrders,canCustomers]);
 const maxSales=Math.max(...stats.salesByDay.map(x=>Number(x.sales||0)),1); const categoryTotal=Math.max(stats.categorySales.reduce((sum,x)=>sum+Number(x.sales||0),0),1);
 return <div className="dashboard-page" dir="rtl">
  <div className="dash-head"><div><div className="eyebrow">MYBRAND CONTROL CENTER</div><h1>لوحة تحكم MYBRAND</h1><p>مؤشرات ورسوم محسوبة مباشرة من بيانات النظام المسموح بها لحسابك.</p></div><div className="dash-head-actions"><button className="dash-search" onClick={()=>window.dispatchEvent(new Event('open-admin-command-center'))}>⌕ <span>بحث في لوحة التحكم</span></button>{canAddProduct&&<button className="primary-action" onClick={()=>window.location.href='/products/add'}>+ إضافة منتج</button>}{canProducts&&<button className="secondary-action" onClick={()=>window.location.href='/categories'}>+ إضافة قسم</button>}</div></div>
  <section className="kpi-grid">
   <article className="kpi"><div className="kpi-top"><span className="kpi-icon red">↗</span></div><strong>{loading?'—':money(stats.sales)}</strong><span>إجمالي المبيعات</span><small>الطلبات غير الملغاة</small></article>
   {canOrders&&<article className="kpi"><div className="kpi-top"><span className="kpi-icon blue">▣</span></div><strong>{loading?'—':num(stats.orders)}</strong><span>إجمالي الطلبات</span><small>الطلبات غير الملغاة</small></article>}
   {canCustomers&&<article className="kpi"><div className="kpi-top"><span className="kpi-icon green">♙</span></div><strong>{loading?'—':num(stats.customers)}</strong><span>العملاء</span><small>من قاعدة البيانات</small></article>}
   <article className="kpi"><div className="kpi-top"><span className="kpi-icon orange">◈</span></div><strong>{loading?'—':money(stats.avg)}</strong><span>متوسط قيمة الطلب</span><small>محسوب من المبيعات الفعلية</small></article>
  </section>
  <div className="dash-two">
   <section className="card sales-card"><div className="card-head"><div><h2>المبيعات خلال آخر 7 أيام</h2><p>قيمة الطلبات غير الملغاة لكل يوم.</p></div></div><div className="chart">{stats.salesByDay.length?stats.salesByDay.map(x=><div key={x.date} style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:5}}><b style={{fontSize:8,color:'#7d899a',whiteSpace:'nowrap'}}>{money(x.sales)}</b><div style={{width:'70%',minWidth:16,maxWidth:34,height:`${Math.max(8,Number(x.sales||0)/maxSales*170)}px`,borderRadius:'7px 7px 3px 3px',background:'linear-gradient(180deg,#ff7a18,#ff4d35)'}}/><span style={{fontSize:9,color:'#8a95a6'}}>{x.date.slice(5)}</span></div>):<div className="empty-dashboard-state">لا توجد مبيعات خلال الفترة المحددة.</div>}</div></section>
   <section className="card category-card"><div className="card-head"><div><h2>المبيعات حسب القسم</h2><p>توزيع مبيعات المنتجات المباعة.</p></div></div><div style={{display:'grid',gap:12,minHeight:235,alignContent:'center'}}>{stats.categorySales.length?stats.categorySales.map((x,i)=><div key={`${x.name}-${i}`}><div style={{display:'flex',justifyContent:'space-between',gap:10,fontSize:10,marginBottom:5}}><b>{x.name}</b><span style={{color:'#8a95a6'}}>{money(x.sales)}</span></div><div style={{height:7,borderRadius:99,background:'#eef1f5',overflow:'hidden'}}><i style={{display:'block',height:'100%',borderRadius:99,width:`${Math.max(3,Number(x.sales||0)/categoryTotal*100)}%`,background:colors[i%colors.length]}}/></div></div>):<div className="empty-dashboard-state">لا توجد بيانات أقسام مباعة حاليًا.</div>}</div></section>
  </div>
  {canOrders&&<div className="dash-two lower"><section className="card orders-card"><div className="card-head"><div><h2>أحدث الطلبات</h2><p>أحدث 5 طلبات فعلية.</p></div><button className="text-btn" onClick={()=>window.location.href='/orders'}>عرض كل الطلبات ←</button></div><div className="table-scroll"><table><thead><tr><th>الطلب</th><th>العميل</th><th>التاجر</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody>{orders.length?orders.map((o,i)=><tr key={o.id||i}><td><b>{o.id}</b></td><td>{o.customer}</td><td>{o.merchant}</td><td><b>{money(o.amount)}</b></td><td>{orderStatus[o.status]||o.status||'—'}</td></tr>):<tr><td colSpan="5" className="empty-dashboard-state">لا توجد طلبات حقيقية لعرضها.</td></tr>}</tbody></table></div></section><section className="card best-card"><div className="card-head"><div><h2>الأكثر مبيعًا</h2><p>بحسب الوحدات المباعة.</p></div>{canProducts&&<button className="text-btn" onClick={()=>window.location.href='/products'}>المنتجات ←</button>}</div><div className="best-list">{stats.topProducts.length?stats.topProducts.map((x,i)=><div className="best-item" key={`${x.name}-${i}`}><span className="rank">#{i+1}</span><div className="product-placeholder">▧</div><div className="best-info"><b>{x.name}</b><span>{num(x.units)} وحدة</span></div><strong>{money(x.sales)}</strong></div>):<div className="empty-dashboard-state">لا توجد بيانات مبيعات منتجات حاليًا.</div>}</div></section></div>}
  <section className="quick-row">{canOrders&&<div><span className="quick-icon">✓</span><div><b>الطلبات</b><small>إدارة الطلبات وحالات الدفع والتنفيذ</small></div><button onClick={()=>window.location.href='/orders'}>مراجعة ←</button></div>}{canProducts&&<div><span className="quick-icon orange-bg">!</span><div><b>المنتجات</b><small>إدارة المنتجات والأقسام والمخزون</small></div><button onClick={()=>window.location.href='/products'}>فتح ←</button></div>}{!canOrders&&!canProducts&&!canCustomers&&<div><span className="quick-icon">✓</span><div><b>حالة الحساب</b><small>اللوحة تعرض البيانات العامة المسموح بها لدورك.</small></div><em>متصل</em></div>}{canCustomers&&<div><span className="quick-icon blue-bg">♙</span><div><b>العملاء</b><small>الوصول إلى بيانات العملاء بحسب صلاحياتك</small></div><button onClick={()=>window.location.href='/customers'}>فتح ←</button></div>}</section>
 </div>;
}
