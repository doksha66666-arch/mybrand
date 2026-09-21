import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/client';
import './TrackingPage.css';
import { useStoreLayout } from '../context/StoreLayoutContext';

const labels = { pending:'قيد الانتظار', confirmed:'تم التأكيد', processing:'قيد التجهيز', shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي' };
const steps = ['pending','confirmed','processing','shipped','delivered'];
const normalizeOrder = (value) => value?.order || value?.data?.order || value?.data || value || null;
const asObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const getOptions = (item) => {
  const source = asObject(item?.selectedOptions);
  if (Object.keys(source).length) return source;
  const out = {};
  if (item?.color != null && String(item.color).trim()) out['اللون'] = item.color;
  if (item?.size != null && String(item.size).trim()) out['المقاس'] = item.size;
  return out;
};
const optionEntries = (item) => Object.entries(getOptions(item)).filter(([, value]) => value != null && String(value).trim() !== '');
const normalizeImage = (value) => { if (!value) return ''; const text = String(value).trim(); if (/^(data:image|https?:|blob:|file:)/i.test(text)) return text; if (text.startsWith('//')) return `https:${text}`; return `${API_ORIGIN}/${text.replace(/^\/+/, '')}`; };

export default function TrackingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getStyle } = useStoreLayout('track');
  const stateOrder = normalizeOrder(location.state?.order);
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const previewMode = typeof window !== 'undefined' && (window.__MYBRAND_CUSTOMIZER_PREVIEW__ === true || new URLSearchParams(window.location.search).get('customizerPreview') === '1');
  const orderId = location.state?.orderId || stateOrder?._id || params.get('orderId');
  const orderNumber = location.state?.orderNumber || stateOrder?.orderNumber || params.get('orderNumber');
  const [order, setOrder] = useState(stateOrder);
  const [loading, setLoading] = useState(!stateOrder);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setError('');
        if (previewMode && !orderId && !orderNumber && !stateOrder) {
          const { data } = await api.get('/products', { params: { limit: 3, page: 1 } });
          const products = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
          const makeItem = (product, index) => ({
            productId: product?._id || product?.id,
            nameSnapshot: product?.nameAr || product?.name || 'منتج',
            imageSnapshot: product?.image || product?.images?.[0] || '',
            unitPrice: Number(product?.price || 0),
            quantity: index + 1,
            selectedOptions: {},
            productCodeSnapshot: product?.sku || product?.code || '',
          });
          const first = products[0] || {};
          const second = products[1] || first;
          const third = products[2] || second;
          const subtotal = Number(first.price || 0) + (Number(second.price || 0) * 2) + (Number(third.price || 0) * 3);
          if (alive) setOrder({
            id: 'preview-track-order',
            orderNumber: 'MB-10248',
            status: 'shipped',
            total: Math.max(subtotal, 580),
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            trackingNumber: 'MYB-TRACK-10248',
            customer: { name: 'عميل MYBRAND', phone: '01000000000' },
            shippingAddress: { street: 'عنوان تجريبي للمعاينة', city: 'القاهرة' },
            items: [makeItem(first, 0), makeItem(second, 1), makeItem(third, 2)],
          });
          return;
        }
        if (orderId) {
          const { data } = await api.get(`/orders/${encodeURIComponent(orderId)}`);
          const next = normalizeOrder(data);
          if (next && alive) setOrder(next);
          if (!next && alive) setError('تعذر العثور على بيانات الطلب');
          return;
        }
        if (orderNumber) {
          const { data } = await api.get('/orders/my');
          const list = Array.isArray(data?.orders) ? data.orders : [];
          const found = list.find((item) => item && String(item.orderNumber) === String(orderNumber));
          if (!found) throw new Error('الطلب غير موجود');
          if (alive) setOrder(found);
          return;
        }
        if (stateOrder) { if (alive) setOrder(stateOrder); return; }
        throw new Error('لم يتم تحديد الطلب');
      } catch (e) {
        if (alive) setError(e?.response?.data?.message || e?.message || 'تعذر تحميل بيانات الطلب');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [orderId, orderNumber, stateOrder, previewMode]);

  if (loading) return <div className="tracking-app" dir="rtl"><div className="tracking-block"><div className="tracking-block-title">جارٍ تحميل بيانات الطلب...</div></div></div>;
  if (error || !order) return <div className="tracking-app" dir="rtl"><div className="tracking-block"><div className="tracking-block-title">{error || 'الطلب غير موجود'}</div><button className="action-btn" type="button" onClick={() => navigate('/orders')}>العودة للطلبات</button></div></div>;

  const current = labels[order.status] ? order.status : 'pending';
  const currentIndex = steps.indexOf(current);
  const items = Array.isArray(order.items) ? order.items.filter(Boolean) : [];
  const shippingAddress = asObject(order.shippingAddress);
  const customer = asObject(order.customer);
  const trackingValue = order.trackingNumber || order.orderNumber || '';
  const canCancel = ['pending', 'confirmed'].includes(current);
  const copyTracking = async () => { try { if (navigator.clipboard && trackingValue) await navigator.clipboard.writeText(String(trackingValue)); } catch (_) {} };
  const cancelOrder = async () => {
    if (!order?._id || cancelling || !canCancel) return;
    const confirmed = window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم إعادة المخزون والقسيمة والنقاط المستبدلة إن وجدت.');
    if (!confirmed) return;
    try {
      setCancelling(true);
      setError('');
      const { data } = await api.post(`/orders/${encodeURIComponent(order._id)}/cancel`);
      const next = normalizeOrder(data);
      if (next) setOrder(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'تعذر إلغاء الطلب. قد يكون دخل مرحلة التجهيز بالفعل.');
    } finally {
      setCancelling(false);
    }
  };

  return <div className="tracking-app" dir="rtl">
    <div className="tracking-topbar" style={getStyle('topbar')}><button className="tracking-back-btn" type="button" onClick={() => navigate('/orders')}>‹</button><h1>تتبع الطلب</h1><button className="tracking-support-btn" type="button" onClick={() => navigate('/account/support/order')}>💬</button></div>
    <div className="status-hero" style={getStyle('status')}><div className="status-badge">{current==='delivered'?'✓ تم التسليم':current==='cancelled'?'✕ ملغي':'🚚 '+(labels[current]||'قيد الانتظار')}</div><h2>{order.orderNumber || '—'}</h2><p>{current==='delivered'?'تم تسليم طلبك بنجاح':current==='cancelled'?'تم إلغاء هذا الطلب':'يمكنك متابعة حالة طلبك من هنا'}</p><div className="order-meta"><div><span>الإجمالي</span><b>{Number(order.total || 0).toLocaleString('ar-EG')} ج.م</b></div><div><span>الحالة</span><b>{labels[current] || 'قيد الانتظار'}</b></div></div></div>
    {trackingValue && <div className="track-strip" style={getStyle('tracking')}><div><div className="track-label">رقم تتبع الشحنة</div><div className="track-value">{trackingValue}</div></div><button className="copy-btn" type="button" onClick={copyTracking}>نسخ</button></div>}
    <div className="tracking-block" style={getStyle('timeline')}><div className="tracking-block-title">حالة الطلب</div>{current==='cancelled'?<div className="timeline"><div className="timeline-item current"><div className="timeline-dot">✕</div><TimelineBody title="ملغي" text="تم إلغاء هذا الطلب" /></div></div>:<div className="timeline">{steps.map((step, index) => <div className={`timeline-item ${index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo'}`} key={step}><div className="timeline-dot">{index < currentIndex ? '✓' : ''}</div><TimelineBody title={labels[step]} text={index === currentIndex ? 'الحالة الحالية للطلب' : ''} /></div>)}</div>}</div>
    {error && <div className="tracking-block"><div className="tracking-block-title">{error}</div></div>}
    {Object.keys(shippingAddress).length > 0 && <div className="tracking-block" style={getStyle('address')}><div className="tracking-block-title">عنوان التوصيل</div><div className="address-row"><div className="address-icon">📍</div><div className="address-text"><b>{customer.name || ''}{customer.phone ? ` — ${customer.phone}` : ''}</b><span>{[shippingAddress.street, shippingAddress.building, shippingAddress.city, shippingAddress.governorate, shippingAddress.center, shippingAddress.country, shippingAddress.postalCode].filter(Boolean).join(' — ') || 'عنوان التوصيل مسجل في الطلب'}{shippingAddress.notes ? ` — ${shippingAddress.notes}` : ''}</span></div></div></div>}
    <div className="tracking-block" style={getStyle('items')}><div className="tracking-block-title">محتويات الطلب ({items.length})</div>{items.length ? items.map((item, index) => { const attrs = optionEntries(item); const product = asObject(item.product); const image = normalizeImage(item.imageSnapshot || item.image || (Array.isArray(product.images) ? product.images[0] : '')); const title = item.nameSnapshot || item.nameAr || item.name || product.nameAr || product.name || 'منتج'; const unitPrice = item.unitPrice ?? item.price ?? 0; return <div className="order-item" key={item._id || `${title}-${index}`}><div className="order-img">{image ? <img src={image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : null}</div><div className="order-body"><div className="order-title">{title}</div><div className="order-attrs">{attrs.map(([name, value]) => <span key={`${name}-${value}`} style={{display:'block'}}>{name}: {value}</span>)}{item.productCodeSnapshot&&<span>كود المنتج: {item.productCodeSnapshot}</span>}<span>الكمية: {Number(item.quantity || 0)}</span></div><div className="order-price">{Number(unitPrice || 0).toLocaleString('ar-EG')} ج.م</div></div></div>; }) : <div className="tracking-block-title">لا توجد تفاصيل منتجات متاحة.</div>}</div>
    <div className="action-row" style={getStyle('actions')}>{canCancel && <button className="action-btn" type="button" onClick={cancelOrder} disabled={cancelling}>{cancelling ? 'جارٍ الإلغاء...' : '✕ إلغاء الطلب'}</button>}<button className="action-btn" type="button" onClick={() => navigate('/account/support/order')}>💬 تواصل مع الدعم</button><button className="action-btn primary" type="button" onClick={() => navigate('/orders')}>العودة إلى طلباتي</button></div>
  </div>;
}
function TimelineBody({ title, text }) { return <div className="timeline-body"><b>{title}</b>{text && <span>{text}</span>}</div>; }
