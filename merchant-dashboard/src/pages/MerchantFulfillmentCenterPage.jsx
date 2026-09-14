import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import './MerchantFulfillmentCenterPage.css';

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

async function copyText(value) { try { await navigator.clipboard.writeText(String(value)); return true; } catch { return false; } }

function printOrders(orders, title = 'ورقة تجهيز MYBRAND') {
  if (!orders?.length) return;
  const popup = window.open('', '_blank', 'width=980,height=760');
  if (!popup) return;
  const cards = orders.map((order) => `<section style="border:1px solid #dbe3ee;border-radius:14px;padding:16px;margin:0 0 14px"><div style="display:flex;justify-content:space-between;gap:12px"><h2 style="margin:0;font-size:18px">طلب MYBRAND #${escapeHtml(order.orderNumber)}</h2><span style="font-size:11px;color:#64748b">${escapeHtml(formatDate(order.createdAt))}</span></div>${(order.items || []).map((item) => `<div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:10px"><h3 style="margin:0 0 8px;font-size:15px">${escapeHtml(nameOf(item))}</h3><div style="display:flex;gap:7px;flex-wrap:wrap;font-size:11px">${[['اللون', colorOf(item) || 'غير محدد'],['المقاس / الخيار', sizeOf(item) || 'غير محدد'],['الكمية', Number(item?.quantity || 0)],['الكود / SKU', skuOf(item) || 'غير متوفر']].map(([a,b]) => `<span style="padding:6px 8px;border:1px solid #dbe3ee;border-radius:8px"><b>${escapeHtml(a)}:</b> ${escapeHtml(b)}</span>`).join('')}</div>${notesOf(item) ? `<div style="margin-top:8px;padding:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px"><b>ملاحظات:</b> ${escapeHtml(notesOf(item))}</div>` : ''}</div>`).join('')}</section>`).join('');
  popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="font-family:Arial,sans-serif;color:#0f172a;padding:26px"><h1 style="margin:0 0 4px">${escapeHtml(title)}</h1><p style="margin:0 0 18px;color:#64748b;font-size:12px">بيانات تنفيذ المنتجات فقط — بدون بيانات العميل أو الدفع أو التوصيل.</p>${cards}<script>window.onload=function(){window.print()}<\\/script></body></html>`);
  popup.document.close();
}

export default function MerchantFulfillmentCenterPage() {
  const [orders, setOrders] = useState([]); const [filter, setFilter] = useState('all'); const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({}); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [busy, setBusy] = useState(''); const [copied, setCopied] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const { data } = await api.get('/orders/merchant/fulfillment'); setOrders(Array.isArray(data?.orders) ? data.orders : []); } catch (err) { setError(err?.response?.data?.message || 'تعذر تحميل طلبات التجهيز'); } finally { setLoading(false); } };
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, []);
  const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, orders.filter((o) => stageOf(o) === s).length])), [orders]);
  const visible = useMemo(() => { const q = search.trim().toLowerCase(); return orders.filter((order) => { if (filter !== 'all' && stageOf(order) !== filter) return false; if (!q) return true; return String(order.orderNumber || '').toLowerCase().includes(q) || (order.items || []).some((item) => nameOf(item).toLowerCase().includes(q) || skuOf(item).toLowerCase().includes(q)); }); }, [orders, filter, search]);
  const advance = async (order) => { const next = nextStage(stageOf(order)); if (!next) return; setBusy(order._id); setError(''); try { const { data } = await api.put(`/orders/merchant/fulfillment/${order._id}`, { merchantStatus: next }); setOrders((current) => current.map((o) => o._id === order._id ? { ...o, merchantStatus: data?.merchantStatus || next } : o)); } catch (err) { setError(err?.response?.data?.message || 'تعذر تحديث حالة التجهيز'); } finally { setBusy(''); } };
  const doCopy = async (value, token) => { if (await copyText(value)) { setCopied(token); window.setTimeout(() => setCopied(''), 1200); } };

  return <div className="fulfillment-page" dir="rtl">
    <header className="fulfillment-header"><div className="fulfillment-heading"><span className="fulfillment-kicker">MYBRAND · مركز تنفيذ التاجر</span><h1>طلبات التجهيز</h1><p>نفّذ منتجات متجرك فقط. بيانات العميل والشحن والدفع غير معروضة للتاجر.</p></div><div className="fulfillment-header-actions"><button className="fulfillment-btn secondary" onClick={() => printOrders(visible, 'طلبات التجهيز الظاهرة')} disabled={!visible.length}>🖨 طباعة النتائج</button><button className="fulfillment-btn primary" onClick={load} disabled={loading}>{loading ? 'جاري…' : '↻ تحديث'}</button></div></header>
    <section className="fulfillment-stats"><Stat label="إجمالي الطلبات" value={orders.length} /><Stat label="قيد التجهيز" value={counts.confirmed + counts.packed} /><Stat label="جاهز للتسليم" value={counts.ready} /><Stat label="عرض حالي" value={visible.length} /></section>
    <section className="fulfillment-privacy"><div><b>🔒 الخصوصية مفعّلة</b><span> اسم العميل · الهاتف · العنوان · التواصل · الدفع</span></div><strong>بيانات تنفيذ فقط</strong></section>
    <section className="fulfillment-toolbar"><div className="fulfillment-tabs"><Filter label="الكل" count={orders.length} active={filter === 'all'} onClick={() => setFilter('all')} />{STAGES.map((s) => <Filter key={s} label={LABELS[s]} count={counts[s] || 0} active={filter === s} onClick={() => setFilter(s)} />)}</div><label className="fulfillment-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="رقم الطلب أو اسم المنتج أو SKU" /></label></section>
    {error && <div className="fulfillment-error">{error}</div>}
    {loading ? <div className="fulfillment-empty">جارٍ تحميل مركز التنفيذ…</div> : !visible.length ? <div className="fulfillment-empty">{search ? 'لا توجد نتائج مطابقة.' : 'لا توجد طلبات تجهيز متاحة.'}</div> : <div className="fulfillment-grid">{visible.map((order) => <OrderCard key={order._id} order={order} expanded={Boolean(expanded[order._id])} setExpanded={setExpanded} advance={advance} busy={busy} copied={copied} doCopy={doCopy} />)}</div>}
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

function Stat({ label, value }) { return <div className="fulfillment-stat"><span>{label}</span><strong>{value}</strong></div>; }
function Filter({ label, count, active, onClick }) { return <button className={`filter-chip ${active ? 'active' : ''}`} onClick={onClick}><span>{label}</span><b>{count}</b></button>; }
