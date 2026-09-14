import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const merchantStages = ['confirmed', 'packed', 'ready'];
const merchantLabels = { confirmed: 'تم تأكيد الطلب', packed: 'تم التعبئة', ready: 'جاهز للتسليم' };
const merchantMeta = {
  confirmed: { icon: '✓', color: '#2563EB', bg: '#EFF6FF' },
  packed: { icon: '📦', color: '#7C3AED', bg: '#F5F3FF' },
  ready: { icon: '🚚', color: '#15803D', bg: '#F0FDF4' },
};

const normalizeStage = (stage) => merchantStages.includes(stage) ? stage : 'confirmed';
const nextStage = (stage) => {
  const index = merchantStages.indexOf(stage);
  return index >= 0 && index < merchantStages.length - 1 ? merchantStages[index + 1] : null;
};

const normalizeOptions = (item) => {
  const source = item?.options || item?.selectedOptions || {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value != null && String(value).trim() !== ''));
};

const key = (value) => String(value || '').trim().toLowerCase();
const valueByKeys = (options, keys) => {
  const entry = Object.entries(options).find(([name]) => keys.includes(key(name)));
  return entry ? String(entry[1]) : '';
};

const getName = (item) => item?.name || item?.nameSnapshot || item?.productName || item?.product?.nameAr || 'منتج';
const getImage = (item) => item?.image || item?.imageSnapshot || item?.variantImage || item?.product?.images?.[0] || '';
const getColor = (item) => item?.color || valueByKeys(normalizeOptions(item), ['color', 'colour', 'اللون', 'لون']) || '';
const getSize = (item) => item?.size || valueByKeys(normalizeOptions(item), ['size', 'المقاس', 'مقاس']) || '';
const getCode = (item) => item?.productCode || item?.sku || item?.productCodeSnapshot || item?.variantSku || item?.product?.sku || '';
const getNotes = (item) => item?.notes || item?.notesSnapshot || item?.fulfillmentNotes || '';
const isBaseOption = (name) => ['color', 'colour', 'اللون', 'لون', 'size', 'المقاس', 'مقاس'].includes(key(name));

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const safeHtml = (value) => String(value ?? '').replace(/[&<>\'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

const printOrder = (order) => {
  const popup = window.open('', '_blank', 'width=900,height=720');
  if (!popup) return;
  const itemHtml = (order.items || []).map((item) => {
    const options = normalizeOptions(item);
    const entries = [
      ['اللون', getColor(item) || 'غير محدد'],
      ['المقاس / الخيار', getSize(item) || 'غير محدد'],
      ['الكمية', Number(item.quantity || 0)],
      ['الكود / SKU', getCode(item) || 'غير متوفر'],
      ...Object.entries(options).filter(([name]) => !isBaseOption(name)),
    ];
    return `<article style="border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin:0 0 14px"><h2 style="margin:0 0 12px;font-size:18px">${safeHtml(getName(item))}</h2><div style="display:flex;gap:8px;flex-wrap:wrap">${entries.map(([label,value]) => `<span style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 9px"><b>${safeHtml(label)}:</b> ${safeHtml(value)}</span>`).join('')}</div>${getNotes(item) ? `<div style="margin-top:10px;padding:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:9px"><b>ملاحظات التنفيذ:</b> ${safeHtml(getNotes(item))}</div>` : ''}</article>`;
  }).join('');
  popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>MYBRAND #${safeHtml(order.orderNumber)}</title></head><body style="font-family:Arial,sans-serif;padding:28px;color:#0f172a"><h1 style="margin:0 0 4px">طلب MYBRAND #${safeHtml(order.orderNumber)}</h1><p style="color:#64748b;margin:0 0 20px">ورقة تجهيز — لا تحتوي على بيانات العميل أو الدفع</p>${itemHtml}<script>window.onload=function(){window.print()}<\/script></body></html>`);
  popup.document.close();
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/orders/merchant/fulfillment');
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل طلبات التجهيز');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(() => Object.fromEntries(
    merchantStages.map((stage) => [stage, orders.filter((order) => normalizeStage(order.merchantStatus) === stage).length])
  ), [orders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const stage = normalizeStage(order.merchantStatus);
      if (filter !== 'all' && stage !== filter) return false;
      if (!query) return true;
      return String(order.orderNumber || '').toLowerCase().includes(query)
        || (order.items || []).some((item) => getName(item).toLowerCase().includes(query) || getCode(item).toLowerCase().includes(query));
    });
  }, [orders, filter, search]);

  const advance = async (orderId, stage) => {
    const next = nextStage(stage);
    if (!next) return;
    setBusy(orderId);
    setError('');
    try {
      const { data } = await api.put(`/orders/merchant/fulfillment/${orderId}`, { merchantStatus: next });
      setOrders((current) => current.map((order) => order._id === orderId ? { ...order, merchantStatus: data?.merchantStatus || next } : order));
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحديث حالة الطلب');
    } finally {
      setBusy('');
    }
  };

  return (
    <div dir="rtl" style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>تشغيل المتجر · مركز التنفيذ</div>
          <h1 style={styles.title}>طلبات التجهيز</h1>
          <p style={styles.sub}>كل ما تحتاجه لتجهيز منتجاتك، بدون أي بيانات شخصية عن العميل.</p>
        </div>
        <button style={styles.refresh} onClick={load} disabled={loading}>{loading ? 'جاري التحديث…' : '↻ تحديث'}</button>
      </header>

      <section style={styles.stats}>
        <Stat label="إجمالي الطلبات" value={orders.length} />
        <Stat label="قيد التنفيذ" value={counts.confirmed + counts.packed} />
        <Stat label="جاهز للتسليم" value={counts.ready} />
        <Stat label="المزامنة" value="كل 30 ثانية" compact />
      </section>

      <section style={styles.privacy}>
        <div><b>🔒 خصوصية العميل محفوظة</b><span style={styles.privacyText}> لا اسم · لا هاتف · لا عنوان · لا بيانات دفع</span></div>
        <span style={styles.privacyPill}>بيانات تنفيذ فقط</span>
      </section>

      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="الكل" count={orders.length} />
          {merchantStages.map((stage) => <FilterButton key={stage} active={filter === stage} onClick={() => setFilter(stage)} label={merchantLabels[stage]} count={counts[stage] || 0} />)}
        </div>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>
          <input style={styles.search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث برقم الطلب أو المنتج أو الكود" />
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {loading ? <div style={styles.empty}>جارٍ تحميل طلبات التجهيز…</div> : !visibleOrders.length ? <div style={styles.empty}>{search ? 'لا توجد نتائج مطابقة.' : 'لا توجد طلبات مطلوبة من متجرك حاليًا.'}</div> : (
        <div style={styles.grid}>
          {visibleOrders.map((order) => {
            const stage = normalizeStage(order.merchantStatus);
            const next = nextStage(stage);
            const meta = merchantMeta[stage];
            const isExpanded = Boolean(expanded[order._id]);
            const items = Array.isArray(order.items) ? order.items : [];
            const shownItems = isExpanded ? items : items.slice(0, 1);
            return (
              <article key={order._id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <span style={styles.orderLabel}>طلب MYBRAND</span>
                    <h2 style={styles.orderNo}>#{order.orderNumber}</h2>
                    {order.createdAt && <span style={styles.date}>{formatDate(order.createdAt)}</span>}
                  </div>
                  <span style={{ ...styles.badge, color: meta.color, background: meta.bg }}>{meta.icon} {merchantLabels[stage]}</span>
                </div>

                <div style={styles.itemHeader}><span>تفاصيل التجهيز</span><b>{items.length} {items.length === 1 ? 'منتج' : 'منتجات'}</b></div>
                <div style={styles.items}>{shownItems.map((item, index) => <FulfillmentItem key={`${order._id}-${index}`} item={item} />)}</div>

                {items.length > 1 && <button style={styles.moreButton} onClick={() => setExpanded((current) => ({ ...current, [order._id]: !current[order._id] }))}>{isExpanded ? 'إخفاء المنتجات' : `عرض كل المنتجات (${items.length})`}</button>}

                <div style={styles.progress}>
                  {merchantStages.map((stageName, index) => {
                    const done = merchantStages.indexOf(stage) >= index;
                    return <React.Fragment key={stageName}><div style={{ ...styles.progressStep, opacity: done ? 1 : 0.4 }}><i style={{ ...styles.stepIcon, background: done ? merchantMeta[stageName].color : '#CBD5E1' }}>{done ? '✓' : index + 1}</i><span>{merchantLabels[stageName]}</span></div>{index < 2 && <div style={{ ...styles.line, background: merchantStages.indexOf(stage) > index ? meta.color : '#E2E8F0' }} />}</React.Fragment>;
                  })}
                </div>

                <div style={styles.actions}>
                  {next ? <button style={{ ...styles.action, background: meta.color }} disabled={busy === order._id} onClick={() => advance(order._id, stage)}>{busy === order._id ? 'جارٍ الحفظ…' : `✓ ${merchantLabels[next]}`}</button> : <div style={styles.ready}>✓ جاهز لتسليم المنتجات إلى MYBRAND</div>}
                  <button style={styles.print} onClick={() => printOrder(order)}>🖨 طباعة</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, compact }) {
  return <div style={styles.stat}><span>{label}</span><b style={compact ? styles.statCompact : undefined}>{value}</b></div>;
}

function FilterButton({ active, onClick, label, count }) {
  return <button onClick={onClick} style={active ? styles.tabActive : styles.tab}>{label} <b>{count}</b></button>;
}

function FulfillmentItem({ item }) {
  const options = normalizeOptions(item);
  const extras = Object.entries(options).filter(([name]) => !isBaseOption(name));
  const color = getColor(item);
  const size = getSize(item);
  const code = getCode(item);
  const notes = getNotes(item);
  const image = getImage(item);
  return (
    <div style={styles.item}>
      <div style={styles.itemMain}>
        <div style={styles.imageWrap}>{image ? <img src={image} alt="" style={styles.image} loading="lazy" /> : <div style={styles.productIcon}>📦</div>}</div>
        <div style={styles.itemBody}>
          <div style={styles.nameRow}>
            <div style={styles.nameBlock}><span style={styles.productLabel}>اسم المنتج</span><b style={styles.productName}>{getName(item)}</b></div>
            <div style={styles.qtyBox}><span>الكمية</span><b>{Number(item?.quantity || 0)}</b></div>
          </div>
          <div style={styles.detailsGrid}>
            <Detail label="اللون" value={color || 'غير محدد'} muted={!color} />
            <Detail label="المقاس / الخيار" value={size || 'غير محدد'} muted={!size} />
            <Detail label="الكود / SKU" value={code || 'غير متوفر'} muted={!code} />
            {extras.map(([name, value]) => <Detail key={name} label={name} value={value} />)}
          </div>
          {notes ? <div style={styles.notes}><b>📝 ملاحظات التنفيذ</b><span>{String(notes)}</span></div> : <div style={styles.noNotes}>لا توجد ملاحظات تنفيذ إضافية.</div>}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, muted }) {
  return <div style={{ ...styles.detail, ...(muted ? styles.detailMuted : {}) }}><span>{label}</span><b>{String(value)}</b></div>;
}

const styles = {
  page: { padding: 26, maxWidth: 1220, margin: '0 auto', fontFamily: 'Cairo, Arial, sans-serif', color: '#0F172A' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 18 },
  kicker: { fontSize: 12, color: '#64748B', fontWeight: 800 }, title: { margin: '4px 0', fontSize: 32, lineHeight: 1.15 }, sub: { margin: 0, color: '#64748B', fontSize: 13, maxWidth: 780 },
  refresh: { border: '1px solid #E2E8F0', background: '#fff', borderRadius: 12, padding: '11px 17px', cursor: 'pointer', fontWeight: 800 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: 13 },
  stat: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 13, padding: '12px 14px', display: 'grid', gap: 3, boxShadow: '0 4px 18px rgba(15,23,42,.04)' },
  statCompact: { fontSize: 13 },
  privacy: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 14, fontSize: 13 }, privacyText: { color: '#64748B', marginRight: 6 }, privacyPill: { background: '#ECFDF5', color: '#047857', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 900 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }, tabs: { display: 'flex', gap: 8, flexWrap: 'wrap' }, tab: { border: '1px solid #E2E8F0', background: '#fff', borderRadius: 10, padding: '10px 13px', cursor: 'pointer', fontWeight: 700 }, tabActive: { border: '1px solid #2563EB', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 10, padding: '10px 13px', cursor: 'pointer', fontWeight: 800 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 320, border: '1px solid #E2E8F0', background: '#fff', borderRadius: 11, padding: '0 11px' }, searchIcon: { fontSize: 18, color: '#64748B' }, search: { border: 0, outline: 0, width: '100%', padding: '10px 2px', fontFamily: 'inherit', fontSize: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(440px,1fr))', gap: 18 }, card: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: 18, boxShadow: '0 8px 28px rgba(15,23,42,.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 13 }, orderLabel: { fontSize: 11, color: '#64748B' }, orderNo: { margin: '2px 0 1px', fontSize: 21 }, date: { fontSize: 10, color: '#94A3B8' }, badge: { borderRadius: 999, padding: '8px 11px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: 10, padding: '8px 10px', marginBottom: 10, fontSize: 11, color: '#64748B' }, items: { display: 'grid', gap: 10 }, item: { border: '1px solid #E2E8F0', borderRadius: 14, padding: 12, background: '#fff' }, itemMain: { display: 'flex', alignItems: 'flex-start', gap: 13 }, imageWrap: { width: 88, height: 88, flex: '0 0 88px', borderRadius: 14, overflow: 'hidden', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'grid', placeItems: 'center' }, image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }, productIcon: { width: 50, height: 50, display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }, itemBody: { minWidth: 0, flex: 1 }, nameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, nameBlock: { minWidth: 0 }, productLabel: { display: 'block', fontSize: 9, color: '#94A3B8', fontWeight: 800 }, productName: { display: 'block', fontSize: 16, marginTop: 2, marginBottom: 9, lineHeight: 1.45 }, qtyBox: { minWidth: 62, textAlign: 'center', display: 'grid', gap: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '6px 8px' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 7 }, detail: { display: 'grid', gap: 2, border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 9, padding: '7px 9px', minWidth: 0 }, detailMuted: { color: '#94A3B8' }, notes: { marginTop: 9, padding: '9px 10px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', display: 'grid', gap: 3, fontSize: 11, color: '#92400E' }, noNotes: { marginTop: 9, padding: '7px 9px', borderRadius: 9, background: '#FAFAFA', color: '#94A3B8', fontSize: 10 },
  moreButton: { width: '100%', marginTop: 9, border: '1px dashed #CBD5E1', background: '#F8FAFC', color: '#334155', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 800, fontSize: 11 },
  progress: { display: 'flex', alignItems: 'center', margin: '18px 0 14px', gap: 6 }, progressStep: { display: 'grid', justifyItems: 'center', gap: 5, minWidth: 78, textAlign: 'center', fontSize: 10 }, stepIcon: { width: 29, height: 29, borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', fontStyle: 'normal', fontWeight: 900 }, line: { height: 2, flex: 1 },
  actions: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }, action: { width: '100%', border: 0, color: '#fff', borderRadius: 11, padding: '12px 14px', fontWeight: 900, cursor: 'pointer' }, ready: { display: 'grid', placeItems: 'center', background: '#F0FDF4', color: '#15803D', borderRadius: 11, padding: 12, textAlign: 'center', fontSize: 11, fontWeight: 900 }, print: { border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A', borderRadius: 11, padding: '0 13px', cursor: 'pointer', fontWeight: 800 },
  empty: { padding: 48, textAlign: 'center', color: '#64748B', background: '#fff', border: '1px dashed #CBD5E1', borderRadius: 16 }, error: { background: '#FEF2F2', color: '#B91C1C', borderRadius: 11, padding: 12, marginBottom: 16 },
};
