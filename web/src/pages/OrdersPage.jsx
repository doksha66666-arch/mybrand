import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/client';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import './OrdersPage.css';
import './OrderSellerBadge.css';
import { useStoreLayout } from '../context/StoreLayoutContext';

const STATUS = { pending: { label: 'قيد الانتظار', step: 1 }, confirmed: { label: 'تم التأكيد', step: 2 }, processing: { label: 'قيد التجهيز', step: 3 }, shipped: { label: 'تم الشحن', step: 4 }, delivered: { label: 'تم التسليم', step: 5 }, cancelled: { label: 'ملغي', step: 0 } };
const PAYMENT = { pending: 'بانتظار الدفع', paid: 'تم الدفع', failed: 'فشل الدفع', refunded: 'تم رد المبلغ' };
const FILTERS = [['all', 'الكل'], ['active', 'قيد المتابعة'], ['delivered', 'تم التسليم'], ['cancelled', 'ملغاة']];
const formatDate = (value) => { if (!value) return '—'; const date = new Date(value); if (Number.isNaN(date.getTime())) return '—'; return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' }).format(date); };
const getItems = (order) => Array.isArray(order?.items) ? order.items : [];
const normalizeImage = (value) => { if (!value) return ''; const text = String(value).trim(); if (/^(data:image|https?:|blob:|file:)/i.test(text)) return text; if (text.startsWith('//')) return `https:${text}`; return `${API_ORIGIN}/${text.replace(/^\/+/, '')}`; };
const getItemImage = (item) => normalizeImage(item?.imageSnapshot || item?.image || item?.images?.[0] || item?.product?.image || item?.product?.images?.[0] || '');
const getItemName = (item) => item?.nameSnapshot || item?.nameAr || item?.name || item?.product?.nameAr || item?.product?.name || 'منتج';
const sellerInfo = (item) => { const level = item?.sellerLevelSnapshot || item?.sellerLevel || 'beginner'; const names = { beginner: 'بائع مبتدئ', featured: 'بائع مميز', five_star: 'بائع 5 نجوم' }; const stars = { beginner: 1, featured: 3, five_star: 5 }; return { name: item?.merchantNameSnapshot || item?.merchant?.storeName || item?.merchant?.businessName || '', label: names[level] || names.beginner, stars: stars[level] || 1, rating: Number(item?.sellerRatingSnapshot ?? item?.sellerRating ?? 0), reviews: Number(item?.sellerReviewCountSnapshot ?? item?.sellerReviewCount ?? 0) }; };
const sellerKey = (item) => { const merchant = item?.merchant || item?.product?.merchant; return merchant?._id || merchant?.id || item?.merchantId || item?.merchantNameSnapshot || 'platform'; };

export default function OrdersPage() {
  const { user } = useAuth(); const location = useLocation(); const navigate = useNavigate(); const { getStyle } = useStoreLayout('orders'); const [orders, setOrders] = useState([]); const [summary, setSummary] = useState({ total: 0, active: 0, delivered: 0, cancelled: 0 }); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pages, setPages] = useState(1); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState('all');
  const previewMode = typeof window !== 'undefined' && (window.__MYBRAND_CUSTOMIZER_PREVIEW__ === true || new URLSearchParams(window.location.search).get('customizerPreview') === '1');
  useEffect(() => {
    let alive = true;
    if (previewMode) {
      setPage(1);
      setLoading(true);
      api.get('/products', { params: { limit: 4, page: 1 } }).then(({ data }) => {
        if (!alive) return;
        const products = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
        const makeItem = (product, index) => ({
          productId: product?._id || product?.id,
          nameSnapshot: product?.nameAr || product?.name || 'منتج',
          imageSnapshot: product?.image || product?.images?.[0] || '',
          priceSnapshot: Number(product?.price || 0),
          quantity: index + 1,
          merchantNameSnapshot: product?.merchant?.businessName || product?.merchant?.storeName || 'MYBRAND',
          sellerLevelSnapshot: index === 0 ? 'five_star' : 'featured',
          sellerRatingSnapshot: index === 0 ? 4.9 : 4.7,
          sellerReviewCountSnapshot: index === 0 ? 128 : 76,
        });
        const first = products[0] || {};
        const second = products[1] || products[0] || {};
        const third = products[2] || products[1] || products[0] || {};
        const now = Date.now();
        setOrders([
          { id: 'preview-order-1', orderNumber: 'MB-10248', status: 'processing', paymentStatus: 'paid', total: Math.max(Number(first.price || 0), 250), createdAt: new Date(now - 86400000).toISOString(), shippingAddress: { city: 'القاهرة' }, items: [makeItem(first, 0), makeItem(second, 1)] },
          { id: 'preview-order-2', orderNumber: 'MB-10192', status: 'delivered', paymentStatus: 'paid', total: Math.max(Number(second.price || 0), 180), createdAt: new Date(now - 604800000).toISOString(), shippingAddress: { city: 'الجيزة' }, items: [makeItem(second, 0), makeItem(third, 1)] },
          { id: 'preview-order-3', orderNumber: 'MB-10141', status: 'cancelled', paymentStatus: 'refunded', total: Math.max(Number(third.price || 0), 120), createdAt: new Date(now - 1296000000).toISOString(), shippingAddress: { city: 'الإسكندرية' }, items: [makeItem(third, 0)] },
        ]);
        setSummary({ total: 3, active: 1, delivered: 1, cancelled: 1 });
        setTotal(3);
        setPages(1);
      }).catch(() => { if (alive) { setOrders([]); setSummary({ total: 0, active: 0, delivered: 0, cancelled: 0 }); setTotal(0); setPages(1); } }).finally(() => { if (alive) setLoading(false); });
      return () => { alive = false; };
    }
    if (!user) { setLoading(false); return () => { alive = false; }; }
    setLoading(true);
    const params = { page, limit: 20 };
    if (filter !== 'all') params.status = filter;
    api.get('/orders/my', { params }).then(({ data }) => {
      if (!alive) return;
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setTotal(Number(data?.total || 0));
      setPage(Math.max(1, Number(data?.page || page)));
      setPages(Math.max(1, Number(data?.pages || 1)));
      setSummary(data?.summary && typeof data.summary === 'object'
        ? {
          total: Number(data.summary.total || 0),
          active: Number(data.summary.active || 0),
          delivered: Number(data.summary.delivered || 0),
          cancelled: Number(data.summary.cancelled || 0),
        }
        : { total: Number(data?.total || 0), active: 0, delivered: 0, cancelled: 0 });
    }).catch(() => {
      if (!alive) return;
      setOrders([]);
      setTotal(0);
      setPages(1);
      setSummary({ total: 0, active: 0, delivered: 0, cancelled: 0 });
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user, previewMode, filter, page]);
  const stats = summary;
  const filteredOrders = orders;
  if (!user && !previewMode) return <EmptyState icon="🔒" title="سجّل الدخول لعرض طلباتك" />;
  if (loading) return <div className="orders-page" dir="rtl"><div className="orders-loading"><span className="orders-spinner" /> جارٍ تحميل طلباتك...</div></div>;
  return <main className="orders-page" dir="rtl"><section className="orders-hero" style={getStyle('hero')}><div className="orders-hero-copy"><span className="orders-eyebrow">حسابي / المشتريات</span><h1>طلباتي</h1><p>كل مشترياتك في مكان واحد، مع متابعة واضحة لحالة كل طلب.</p></div><div className="orders-box-icon" aria-hidden="true">📦</div></section>
    {location.state?.justPlaced&&<div className="orders-success" role="status"><div className="orders-success-icon">✓</div><div><strong>تم إنشاء طلبك بنجاح</strong><span>رقم الطلب: {location.state.justPlaced}</span></div></div>}
    <section className="orders-stats" aria-label="ملخص الطلبات" style={getStyle('stats')}><div className="orders-stat"><span>إجمالي الطلبات</span><strong>{stats.total}</strong></div><div className="orders-stat"><span>قيد المتابعة</span><strong>{stats.active}</strong></div><div className="orders-stat"><span>تم التسليم</span><strong>{stats.delivered}</strong></div></section>
    <section className="orders-toolbar" aria-label="تصفية الطلبات" style={getStyle('toolbar')}><div><h2>سجل الطلبات</h2><span>{total} {total === 1 ? 'طلب' : 'طلبات'}</span></div><div className="orders-filters" role="tablist" aria-label="حالة الطلبات">{FILTERS.map(([key, label]) => <button key={key} type="button" className={`orders-filter ${filter === key ? 'is-active' : ''}`} onClick={() => { setFilter(key); setPage(1); }} aria-selected={filter === key} role="tab">{label}{key === 'all' ? stats.total : key === 'active' ? stats.active : key === 'delivered' ? stats.delivered : stats.cancelled}</button>)}</div></section>
    {!filteredOrders.length?<div className="orders-empty"><div className="orders-empty-icon">{filter === 'all' ? '🛍️' : '📭'}</div><h2>{filter === 'all' ? 'لا توجد طلبات بعد' : 'لا توجد طلبات في هذا القسم'}</h2><p>{filter === 'all' ? 'ابدأ التسوق وستظهر طلباتك هنا مع كل تفاصيلها.' : 'جرّب اختيار حالة أخرى لمشاهدة باقي طلباتك.'}</p>{filter === 'all'?<button type="button" onClick={() => navigate('/')}>ابدأ التسوق</button>:<button type="button" className="orders-secondary-button" onClick={() => setFilter('all')}>عرض كل الطلبات</button>}</div>:<section className="orders-list" style={getStyle('list')}>{filteredOrders.map((order,index)=>{ const id=order?._id||order?.id||`order-${index}`; const status=STATUS[order?.status]||STATUS.pending; const items=getItems(order); const trackId=order?._id||order?.id; const trackQuery=new URLSearchParams(); if(trackId) trackQuery.set('orderId',trackId); if(order?.orderNumber) trackQuery.set('orderNumber',order.orderNumber); const sellerGroups=items.reduce((groups,item)=>{const key=String(sellerKey(item));if(!groups[key])groups[key]={items:[],seller:sellerInfo(item)};groups[key].items.push(item);return groups},{}); return <article className={`order-card ${order?.status === 'cancelled' ? 'is-cancelled' : ''}`} key={id}><header className="order-card-header"><div className="order-heading"><span className="order-package">📦</span><div><span className="order-label">رقم الطلب</span><strong>{order?.orderNumber||'طلب'}</strong></div></div><span className={`order-status status-${order?.status||'pending'}`}>{status.label}</span></header><div className="order-meta"><span><b>تاريخ الطلب</b>{formatDate(order?.createdAt)}</span><span><b>الدفع</b>{PAYMENT[order?.paymentStatus]||'بانتظار الدفع'}</span><span><b>الإجمالي</b><strong>{Number(order?.total||0).toLocaleString('ar-EG')} ج.م</strong></span></div>{items.length>0&&<div className="order-products">{items.slice(0,4).map((item,itemIndex)=>{const image=getItemImage(item);return <div className="order-product" key={`${id}-item-${itemIndex}`} title={getItemName(item)}>{image?<img src={image} alt={getItemName(item)}/>:<span>🛍️</span>}</div>})}{items.length>4&&<div className="order-more">+{items.length-4}</div>}<span className="order-items-count">{items.length} {items.length===1?'منتج':'منتجات'}</span></div>}{items.length>0&&<div className="order-sellers" aria-label="البائعون في الطلب">{Object.values(sellerGroups).map((group,groupIndex)=>{const seller=group.seller; if(!seller.name)return null; return <div className="order-seller" key={`${id}-seller-${groupIndex}`}><div className="order-seller-name"><span className="order-seller-icon">★</span><div><strong>{seller.name}</strong><span>{group.items.length} {group.items.length===1?'منتج':'منتجات'} • {seller.label}</span></div></div><div className="order-seller-rating"><span>{'★'.repeat(seller.stars)}<i>{'★'.repeat(5-seller.stars)}</i></span>{seller.rating>0&&<b>{seller.rating.toFixed(1)}</b>}{seller.reviews>0&&<small>({seller.reviews.toLocaleString('ar-EG')} تقييم)</small>}</div></div>})}</div>}{items.length>0&&Object.values(sellerGroups).length>1&&<div className="order-seller-note">هذا الطلب يحتوي على منتجات من {Object.values(sellerGroups).length} بائعين، وسيتم تجهيز كل مجموعة حسب البائع.</div>}{order?.status!=='cancelled'&&<div className="order-progress" aria-label={`حالة الطلب: ${status.label}`}>{['pending','confirmed','processing','shipped','delivered'].map((key,stepIndex)=><React.Fragment key={key}><span className={`progress-dot ${stepIndex+1<=status.step?'done':''}`}>{stepIndex+1<=status.step?'✓':''}</span>{stepIndex<4&&<span className={`progress-line ${stepIndex+1<status.step?'done':''}`}/>}</React.Fragment>)}</div>}<footer className="order-card-footer"><span>{status.label}{order?.shippingAddress?.city?` • ${order.shippingAddress.city}`:''}</span><button type="button" className="order-track-button" disabled={!trackId} onClick={()=>navigate(`/track${trackQuery.toString()?`?${trackQuery.toString()}`:''}`,{state:{orderId:trackId,orderNumber:order?.orderNumber}})}>تتبع الطلب <span>←</span></button></footer></article>})}</section>}
    {pages > 1 && <nav className="orders-pagination" aria-label="صفحات الطلبات"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>السابق</button><span>صفحة {page} من {pages}</span><button type="button" disabled={page >= pages || loading} onClick={() => setPage((current) => Math.min(pages, current + 1))}>التالي</button></nav>}
  </main>;
}
