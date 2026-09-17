import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './MerchantFulfillmentCenterPage.css';

const PAGE_SIZE = 20;
const STAGES = ['confirmed', 'packed', 'ready'];
const LABELS = { confirmed: 'تم تأكيد الطلب', packed: 'تم التعبئة', ready: 'جاهز للتسليم' };
const META = {
  confirmed: { icon: '✓', color: '#2563eb', bg: '#eff6ff' },
  packed: { icon: '📦', color: '#7c3aed', bg: '#f5f3ff' },
  ready: { icon: '🚚', color: '#15803d', bg: '#f0fdf4' },
};

const key = (v) => String(v ?? '').trim().toLowerCase(); 
const normalizeOptions = (item) => {
  const source = item?.options || item?.selectedOptions || {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
  return Object.fromEntries(Object.entries(source).filter(([, v]) => v != null && String(v).trim() !== ''));
};
const byKeys = (options, aliases) => {
  const hit = Object.entries(options).find(([name]) => aliases.includes(key(name)));
  return hit ? String(hit[1]) : '';
};
const nameOf = (item) => item?.name || item?.nameSnapshot || item?.productName || item?.product?.nameAr || 'منتج غير مسمى';
const imageOf = (item) => item?.image || item?.imageSnapshot || item?.variantImage || item?.product?.images?.[0] || '';
const colorOf = (item) => item?.color || byKeys(normalizeOptions(item), ['color', 'colour', 'اللون', 'لون']);
const sizeOf = (item) => item?.size || byKeys(normalizeOptions(item), ['size', 'المقاس', 'مقاس']);
const skuOf = (item) => item?.productCode || item?.productCodeSnapshot || item?.sku || item?.variantSku || item?.product?.sku || '';
const notesOf = (item) => item?.notes || item?.notesSnapshot || item?.fulfillmentNotes || '';
const stageOf = (order) => STAGES.includes(order?.merchantStatus) ? order.merchantStatus : 'confirmed';
const nextStage = (stage) => { const i = STAGES.indexOf(stage); return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null; };
const formatDate = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(d) : ''; };
const escapeHtml = (v) => String(v ?? '').replace(/[&<>\'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

async function copyText(value) {
  try { await navigator.clipboard.writeText(String(value)); return true; } catch { return false; }
}

function printOrders(orders, title = 'ورقة تجهيز MYBRAND') {
  if (!orders?.length) return;
  const popup = window.open('', '_blank', 'width=980,height=760');
  if (!popup) return;
  const cards = orders.map((order) => `<section style="border:1px solid #dbe3ee;border-radius:14px;padding:16px;margin:0 0 14px"><div style="display:flex;justify-content:space-between;gap:12px"><h2 style="margin:0;font-size:18px">طلب MYBRAND #${escapeHtml(order.orderNumber)}</h2><span style="font-size:11px;color:#64748b">${escapeHtml(formatDate(order.createdAt))}</span></div>${(order.items || []).map((item) => `<div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:10px"><h3 style="margin:0 0 8px;font-size:15px">${escapeHtml(nameOf(item))}</h3><div style="display:flex;gap:7px;flex-wrap:wrap;font-size:11px">${[['اللون', colorOf(item) || 'غير محدد'],['المقاس / الخيار', sizeOf(item) || 'غير محدد'],['الكمية', Number(item?.quantity || 0)],['الكود / SKU', skuOf(item) || 'غير متوفر']].map(([a,b]) => `<span style="padding:6px 8px;border:1px solid #dbe3ee;border-radius:8px"><b>${escapeHtml(a)}:</b> ${escapeHtml(b)}</span>`).join('')}</div>${notesOf(item) ? `<div style="margin-top:8px;padding:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px"><b>ملاحظات:</b> ${escapeHtml(notesOf(item))}</div>` : ''}</div>`).join('')}</section>`).join('');
  popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="font-family:Arial,sans-serif;color:#0f172a;padding:26px"><h1 style="margin:0 0 4px">${escapeHtml(title)}</h1><p style="margin:0 0 18px;color:#64748b;font-size:12px">بيانات تنفيذ المنتجات فقط — بدون بيانات العميل أو الدفع أو التوصيل.</p>${cards}<script>window.onload=function(){window.print()}<\\/script></body></html>`);
  popup.document.close();
}

export default function MerchantFulfillmentCenterPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
  const [counts, setCounts] = useState({ confirmed: 0, packed: 0, ready: 0 });
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState('');
  const [page, setPage] = useState(1);

  const load = async (options = {}) => {
    const targetPage = options.page ?? page;
    const targetFilter = options.filter ?? filter;
    const targetSearch = options.search ?? search;
    setLoading(true);
    setError('');
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (targetFilter !== 'all') params.stage = targetFilter;
      if (targetSearch.trim()) params.search = targetSearch.trim();
      const { data } = await api.get('/orders/merchant/fulfillment', { params });
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setPagination(data?.pagination || { page: targetPage, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: targetPage > 1 });
      setCounts({ confirmed: Number(data?.counts?.confirmed || 0), packed: Number(data?.counts?.packed || 0), ready: Number(data?.counts?.ready || 0) });
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل طلبات التجهيز');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), 30000);
    return () => clearInterval(timer);
  }, [page, filter, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch !== search) {
        setPage(1);
        setSearch(nextSearch);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    if (!loading && pagination.totalPages > 0 && page > pagination.totalPages) setPage(pagination.totalPages);
    if (!loading && pagination.totalPages === 0 && page !== 1) setPage(1);
  }, [loading, page, pagination.totalPages]);

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const advance = async (order) => {
    const next = nextStage(stageOf(order));
    if (!next) return;
    setBusy(order._id);
    setError('');
    try {
      const { data } = await api.put(`/orders/merchant/fulfillment/${order._id}`, { merchantStatus: next });
      setOrders((current) => current.map((o) => o._id === order._id ? { ...o, merchantStatus: data?.merchantStatus || next } : o));
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحديث حالة التجهيز');
    } finally {
      setBusy('');
    }
  };

  const doCopy = async (value, token) => {
    if (await copyText(value)) {
      setCopied(token);
      window.setTimeout(() => setCopied(''), 1200);
    }
  };

  const pageCount = Math.max(1, pagination.totalPages || 0);
  const hasPrevious = Boolean(pagination.hasPreviousPage || page > 1);
  const hasNext = Boolean(pagination.hasNextPage || (pagination.totalPages > 0 && page < pagination.totalPages));

  return <div className="fulfillment-page" dir="rtl">
    <header className="fulfillment-header">
      <div className="fulfillment-heading"><span className="fulfillment-kicker">MYBRAND · مركز تنفيذ التاجر</span><h1>طلبات التجهيز</h1><p>نفّذ منتجات متجرك فقط. بيانات العميل والشحن والدفع غير معروضة للتاجر.</p></div>
      <div className="fulfillment-header-actions"><button className="fulfillment-btn secondary" onClick={() => printOrders(orders, 'طلبات التجهيز الظاهرة')} disabled={!orders.length}>🖨 طباعة النتائج</button><button className="fulfillment-btn primary" onClick={() => load()} disabled={loading}>{loading ? 'جاري…' : '↻ تحديث'}</button></div>
    </header>

    <section className="fulfillment-stats">
      <Stat label="إجمالي الطلبات" value={pagination.total} />
      <Stat label="قيد التجهيز" value={counts.confirmed + counts.packed} />
      <Stat label="جاهز للتسليم" value={counts.ready} />
      <Stat label="في الصفحة" value={orders.length} />
    </section>

    <section className="fulfillment-privacy"><div><b>🔒 الخصوصية مفعّلة</b><span> اسم العميل · الهاتف · العنوان · التواصل · الدفع</span></div><strong>بيانات تنفيذ فقط</strong></section>

    <section className="fulfillment-toolbar">
      <div className="fulfillment-tabs">
        <Filter label="الكل" count={pagination.total} active={filter === 'all'} onClick={() => { setFilter('all'); setPage(1); }} />
        {STAGES.map((s) => <Filter key={s} label={LABELS[s]} count={counts[s] || 0} active={filter === s} onClick={() => { setFilter(s); setPage(1); }} />)}
      </div>
      <label className="fulfillment-search"><span>⌕</span><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="رقم الطلب أو اسم المنتج أو SKU" />{searchInput && <button type="button" onClick={clearSearch} aria-label="مسح البحث">×</button>}</label>
    </section>

    {error && <div className="fulfillment-error">{error}</div>}
    {loading ? <div className="fulfillment-empty">جارٍ تحميل مركز التنفيذ…</div> : !orders.length ? <div className="fulfillment-empty">{search ? 'لا توجد نتائج مطابقة.' : 'لا توجد طلبات تجهيز متاحة.'}</div> :
      <div className="fulfillment-grid">{orders.map((order) => <OrderCard key={order._id} order={order} expanded={Boolean(expanded[order._id])} setExpanded={setExpanded} advance={advance} busy={busy} copied={copied} doCopy={doCopy} />)}</div>}

    {pagination.total > 0 && <footer className="fulfillment-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 }}>
      <button className={`fulfillment-btn secondary ${!hasPrevious ? 'disabled' : ''}`} disabled={!hasPrevious || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>السابق</button>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>صفحة {Math.min(page, pageCount)} من {pageCount}</span>
      <button className={`fulfillment-btn secondary ${!hasNext ? 'disabled' : ''}`} disabled={!hasNext || loading} onClick={() => setPage((value) => value + 1)}>التالي</button>
    </footer>}
  </div>;
}

function OrderCard({ order, expanded, setExpanded, advance, busy, copied, doCopy }) {
  const stage = stageOf(order); const meta = META[stage]; const next = nextStage(stage); const items = Array.isArray(order.items) ? order.items : []; const shown = expanded ? items : items.slice(0, 1);
  return <article className="fulfillment-order-card">
    <div className="order-card-head"><div><span className="order-label">طلب MYBRAND</span><h2>#{order.orderNumber}</h2>{order.createdAt && <time>{formatDate(order.createdAt)}</time>}</div><span className="stage-badge" style={{ color: meta.color, background: meta.bg }}>{meta.icon} {LABELS[stage]}</span></div>
    <div className="order-card-tools"><span>{items.length} {items.length === 1 ? 'منتج' : 'منتجات'}</span><button onClick={() => doCopy(order.orderNumber, `order-${order._id}`)}>{copied === `order-${order._id}` ? '✓ تم النسخ' : 'نسخ رقم الطلب'}</button></div>
    <div className="fulfillment-items">{shown.map((item, index) => <FulfillmentItem key={`${order._id}-${index}`} item={item} onCopy={doCopy} copied={copied} token={`${order._id}-${index}`} />)}</div>
    {items.length > 1 && <button className="show-more" onClick={() => setExpanded((current) => ({ ...current, [order._id]: !current[order._id] }))}>{expanded ? '▲ إخفاء بقية المنتجات' : `▼ عرض كل المنتجات (${items.length})`}</button>}
    <div className="fulfillment-progress">{STAGES.map((s, i) => { const done = STAGES.indexOf(stage) >= i; return <React.Fragment key={s}><div className={`progress-step ${done ? 'done' : ''}`}><i style={{ background: done ? META[s].color : '#cbd5e1' }}>{done ? '✓' : i + 1}</i><span>{LABELS[s]}</span></div>{i < 2 && <div className={`progress-line ${STAGES.indexOf(stage) > i ? 'done' : ''}`} />}</React.Fragment>; })}</div>
    <div className="order-actions">{next ? <button className="advance-btn" style={{ background: meta.color }} onClick={() => advance(order)} disabled={busy === order._id}>{busy === order._id ? 'جارٍ الحفظ…' : `✓ ${LABELS[next]}`}</button> : <div className="ready-message">✓ المنتجات جاهزة لتسليمها إلى MYBRAND</div>}<button className="print-btn" onClick={() => printOrders([order], `تجهيز الطلب #${order.orderNumber}`)}>🖨 طباعة</button></div>
  </article>;
}

function FulfillmentItem({ item, onCopy, copied, token }) {
  const options = normalizeOptions(item); const extras = Object.entries(options).filter(([name]) => !['color','colour','اللون','لون','size','المقاس','مقاس'].includes(key(name)));
  const details = [['اللون', colorOf(item) || 'غير محدد'], ['المقاس / الخيار', sizeOf(item) || 'غير محدد'], ['الكود / SKU', skuOf(item) || 'غير متوفر']];
  return <div className="fulfillment-item"><div className="item-main"><div className="item-image">{imageOf(item) ? <img src={imageOf(item)} alt="" loading="lazy" /> : <span>📦</span>}</div><div className="item-content"><div className="item-title-row"><div className="item-name"><span>اسم المنتج</span><b>{nameOf(item)}</b></div><div className="item-qty"><small>الكمية</small><strong>{Number(item?.quantity || 0)}</strong></div></div><div className="item-details">{details.map(([label, value]) => <div className="item-detail" key={label}><span>{label}</span><b>{value}</b>{label === 'الكود / SKU' && skuOf(item) ? <button onClick={() => onCopy(skuOf(item), `sku-${token}`)}>{copied === `sku-${token}` ? '✓' : 'نسخ'}</button> : null}</div>)}{extras.map(([label, value]) => <div className="item-detail" key={`extra-${label}`}><span>{label}</span><b>{String(value)}</b></div>)}</div>{notesOf(item) ? <div className="item-notes"><span>ملاحظات التنفيذ</span><b>{notesOf(item)}</b></div> : null}</div></div></div>;
}

function Stat({ label, value }) { return <div className="fulfillment-stat"><span>{label}</span><strong>{Number(value || 0).toLocaleString('ar-EG')}</strong></div>; }
function Filter({ label, count, active, onClick }) { return <button className={`filter-chip ${active ? 'active' : ''}`} onClick={onClick}><span>{label}</span><b>{Number(count || 0).toLocaleString('ar-EG')}</b></button>; }
