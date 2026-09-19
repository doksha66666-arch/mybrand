import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api, { API_ORIGIN } from '../api/client';
import { useStoreLayout } from '../context/StoreLayoutContext';
import './CartPage.css';

const money = (value) => Number(value || 0).toLocaleString('ar-EG');
const normalizeValue = (value) => String(value ?? '').trim().toLocaleLowerCase('ar-EG').replace(/\s+/g, ' ');
const optionValue = (value) => value?.value ?? value?.label ?? value?.name ?? '';
const getOptions = (item) => {
  if (item?.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions)) return item.selectedOptions;
  if (Array.isArray(item.selectedOptions)) return Object.fromEntries(item.selectedOptions.map((v) => [v?.name ?? v?.optionName, optionValue(v)]).filter(([k, v]) => k && v));
  const out = {};
  if (item?.color) out['اللون'] = item.color;
  if (item?.size) out['المقاس'] = item.size;
  return out;
};
const getOption = (item, wanted) => {
  const options = getOptions(item);
  const names = wanted === 'color' ? ['color','colour','اللون','لون'] : ['size','المقاس','مقاس'];
  const key = Object.keys(options).find((name) => names.includes(String(name).trim().toLowerCase()));
  return key ? String(options[key]) : '';
};
const optionKey = (name) => {
  const n = String(name || '').trim().toLowerCase();
  if (['color','colour','اللون','لون'].includes(n)) return 'color';
  if (['size','المقاس','مقاس'].includes(n)) return 'size';
  return n || 'option';
};
const lineKey = (item) => {
  const id = String(item?.id ?? item?._id ?? '');
  const variantId = item?.variantId != null ? String(item.variantId) : '';
  const options = getOptions(item);
  const optionText = Object.keys(options).sort().map((key) => `${key}:${options[key]}`).join('|');
  return `${id}:${variantId}:${optionText}`;
};

const imageCandidates = (item) => {
  const values = [item?.image, Array.isArray(item?.images) ? item.images[0] : item?.images, item?.imageUrl, item?.thumbnail, item?.photo];
  return [...new Set(values.flatMap((value) => {
    if (!value) return [];
    const raw = String(value).trim();
    if (/^(data:image|https?:\/\/|blob:|file:)/i.test(raw)) return [raw];
    if (/^\/\//.test(raw)) return [`https:${raw}`];
    return [`${API_ORIGIN}/${raw.replace(/^\/+/, '')}`];
  }))];
};
const Check = ({ on }) => <span className={`cart-check ${on ? 'on' : ''}`} aria-hidden="true">{on && <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>}</span>;
const Icon = ({ type = 'bag', color = '#7c3aed' }) => <svg className="cart-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.35" aria-hidden="true"><path d={type === 'shoe' ? 'M4 13l3-5 5 2 3 4 5 1v3H4z' : type === 'shirt' ? 'M7 4l5 3 5-3 3 5-3 2v9H7v-9L4 9z' : 'M6 2l1.5 3h9L18 2M4 8l4-6h8l4 6-3 2v12H7V10z'} /></svg>;
function CartItemImage({ item }) {
  const candidates = useMemo(() => imageCandidates(item), [item]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [candidates.join('|')]);
  const src = candidates[index];
  if (!src) return <Icon type={item?.icon || 'bag'} />;
  return <img src={src} alt={item?.name || ''} loading="lazy" onError={() => setIndex((value) => value + 1)} />;
}

function CartPage() {
  const navigate = useNavigate();
  const { getStyle } = useStoreLayout('cart');
  const { items, increaseQuantity, decreaseQuantity, removeFromCart, removeItems, clearCart, itemsCount } = useCart();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [liveStock, setLiveStock] = useState({});
  const normalized = useMemo(() => Array.isArray(items) ? items.filter(Boolean).map((item) => ({ ...item, id: item?.id ?? item?._id ?? '', quantity: Math.max(1, Number(item?.quantity) || 1), price: Math.max(0, Number(item?.price) || 0), store: String(item?.store || 'official') })) : [], [items]);
  const keys = useMemo(() => new Set(normalized.map(lineKey)), [normalized]);
  useEffect(() => { setSelected((prev) => { const next = new Set([...prev].filter((key) => keys.has(key))); if (!prev.size) normalized.forEach((item) => next.add(lineKey(item))); return next; }); }, [keys, normalized]);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const unique = [...new Map(normalized.map((item) => [String(item?.id ?? item?._id ?? ''), item])).values()];
      if (!unique.length) { if (alive) setLiveStock({}); return; }
      const next = {};
      await Promise.all(unique.map(async (item) => {
        const identifiers = [item?.slug, item?.productSlug, item?.product?.slug, item?.productId, item?.id, item?._id].filter((value, index, arr) => value != null && String(value).trim() && arr.findIndex((v) => String(v) === String(value)) === index);
        for (const identifier of identifiers) {
          try {
            const { data } = await api.get(`/products/${encodeURIComponent(String(identifier).trim())}`);
            const product = data?.product || data?.data || data;
            if (product) { next[String(lineKey(item))] = product; break; }
          } catch (_) {}
        }
      }));
      if (alive) setLiveStock(next);
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [normalized]);
  const selectedItems = useMemo(() => normalized.filter((item) => selected.has(lineKey(item))), [normalized, selected]);
  const selectedTotal = useMemo(() => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [selectedItems]);
  const selectedCount = useMemo(() => selectedItems.reduce((sum, item) => sum + item.quantity, 0), [selectedItems]);
  const allSelected = normalized.length > 0 && normalized.every((item) => selected.has(lineKey(item)));
  const groups = useMemo(() => { const map = new Map(); normalized.forEach((item) => { const key = item.store || 'official'; if (!map.has(key)) map.set(key, []); map.get(key).push(item); }); return [...map.entries()]; }, [normalized]);
  const storeName = (store) => store === 'official' ? 'MYBRAND الرسمي' : store === 'partner' ? 'متجر شريك' : store;
  const toggle = (item) => { const key = lineKey(item); setSelected((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; }); };
  const getProductIdentifier = (item) => item?.slug ?? item?.productSlug ?? item?.product?.slug ?? item?.productId ?? item?.id ?? item?._id ?? null;
  const openProduct = (item) => { const identifier = getProductIdentifier(item); if (identifier != null && String(identifier).trim()) navigate(`/products/${encodeURIComponent(String(identifier).trim())}`); };
  const cardKeyDown = (event, item) => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProduct(item); } };
  const findVariant = (variants, name, value) => variants.find((variant) => optionKey(variant?.name ?? variant?.optionName) === optionKey(name) && normalizeValue(variant?.value ?? variant?.label ?? variant?.name) === normalizeValue(value));
  const getVariantStatus = (item) => {
    const product = liveStock[lineKey(item)];
    if (!product) return { stock: Math.max(0, Number(item?.stock ?? item?.quantity ?? 0)), outOptions: new Set(), source: 'fallback' };
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) return { stock: Math.max(0, Number(product?.stock ?? product?.quantity ?? item?.stock ?? 0)), outOptions: new Set(), source: 'product' };

    const options = getOptions(item);
    const matched = Object.entries(options)
      .map(([name, value]) => ({ name, value, variant: findVariant(variants, name, value) }))
      .filter((entry) => entry.variant);

    if (matched.length) {
      const outOptions = new Set(
        matched.filter((entry) => Number(entry.variant?.stock ?? 0) <= 0).map((entry) => optionKey(entry.name)),
      );
      const stock = Math.min(...matched.map((entry) => Math.max(0, Number(entry.variant?.stock ?? 0))));
      return { stock, outOptions, source: 'options' };
    }

    if (item?.variantId != null) {
      const selectedVariant = variants.find(
        (variant) => String(variant?._id ?? variant?.id ?? '') === String(item.variantId),
      );
      if (selectedVariant) {
        const stock = Math.max(0, Number(selectedVariant.stock ?? 0));
        return { stock, outOptions: stock === 0 ? new Set(['variant']) : new Set(), source: 'variant' };
      }
    }

    return {
      stock: Math.max(0, Number(product?.stock ?? product?.quantity ?? item?.stock ?? 0)),
      outOptions: new Set(),
      source: 'product',
    };
  };
  const getCurrentStock = (item) => getVariantStatus(item).stock;
  const invalidSelected = useMemo(() => selectedItems.some((item) => { const stock = getVariantStatus(item).stock; return stock === 0 || (stock != null && stock < item.quantity); }), [selectedItems, liveStock]);
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(normalized.filter((item) => getCurrentStock(item) !== 0).map(lineKey)));
  const remove = (item) => { removeFromCart(item.id, item.variantId ?? null, getOptions(item)); setSelected((prev) => { const next = new Set(prev); next.delete(lineKey(item)); return next; }); };
  const removeSelected = () => { if (!selectedItems.length) return; removeItems(selectedItems); setSelected(new Set()); };
  const clearAll = () => { if (!normalized.length) return; if (window.confirm('هل تريد تفريغ السلة بالكامل؟')) { clearCart(); setSelected(new Set()); setEditing(false); } };
  const goToCheckout = () => { if (!selectedItems.length || invalidSelected) return; navigate('/checkout', { state: { selectedItems: selectedItems.map((item) => ({ ...item })) } }); };
  if (!normalized.length) return <main className="cart-app" dir="rtl"><header className="cart-topbar" style={getStyle('header')}><button type="button" className="cart-back" onClick={() => navigate(-1)} aria-label="رجوع">‹</button><div className="cart-title-wrap"><h1>سلة المشتريات</h1><span>٠ قطعة</span></div><button type="button" className="cart-edit" onClick={() => navigate('/')}>تسوق</button></header><section className="cart-empty"><div className="cart-empty-icon"><Icon /></div><div className="cart-kicker">MYBRAND CART</div><h2>سلتك فاضية حاليًا</h2><p>اكتشف المنتجات وأضف ما يعجبك إلى السلة، وسيظهر هنا مباشرة.</p><button type="button" onClick={() => navigate('/')}>ابدأ التسوق <span>←</span></button></section></main>;
  return <main className="cart-app" dir="rtl">
    <header className="cart-topbar"><button type="button" className="cart-back" onClick={() => navigate(-1)} aria-label="رجوع"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg></button><div className="cart-title-wrap"><h1>سلة المشتريات</h1><span>{money(itemsCount)} قطعة</span></div><button type="button" className="cart-edit" onClick={() => setEditing((value) => !value)}>{editing ? 'تم' : 'تعديل'}</button></header>
    <section className="select-all-row" style={getStyle('items')}><button type="button" className="select-left" onClick={toggleAll} aria-pressed={allSelected}><Check on={allSelected} /><span>{allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span></button><div className="select-actions"><span className="selected-count">{money(selectedCount)} قطعة محددة</span>{editing && <><button type="button" className="delete-selected" onClick={removeSelected} disabled={!selectedItems.length}>حذف المحدد</button><button type="button" className="clear-cart" onClick={clearAll}>تفريغ السلة</button></>}</div></section>
    {invalidSelected && <div role="alert" style={{margin:'12px 0 2px',padding:'11px 14px',borderRadius:14,border:'1px solid #fda4af',background:'#fff1f2',color:'#9f1239',fontWeight:900,fontSize:12}}>⚠️ يوجد اختيار نفدت كميته أو أصبحت كميته المتاحة أقل من الكمية الموجودة في السلة. راجع اللون/المقاس المحدد.</div>}
    <div className="cart-selection-note" role="status"><span>✓</span><div><b>{selectedItems.length ? `${money(selectedCount)} قطعة جاهزة للشراء` : 'لم يتم اختيار منتجات'}</b><small>{selectedItems.length ? 'سيتم إرسال المنتجات المحددة فقط إلى صفحة إتمام الشراء.' : 'حدد المنتجات التي تريد شراءها للمتابعة.'}</small></div></div>
    {groups.map(([store, group]) => <section className="shop-group" key={store} style={getStyle('items')}><div className="shop-head"><span>🛍️ {storeName(store)}</span><small>{money(group.reduce((sum, item) => sum + item.quantity, 0))} قطعة</small></div>{group.map((item) => {
      const key = lineKey(item); const isSelected = selected.has(key); const color = getOption(item, 'color'); const size = getOption(item, 'size'); const options = getOptions(item); const optionEntries = Object.entries(options); const lineTotal = item.price * item.quantity; const productIdentifier = getProductIdentifier(item); const canOpenProduct = productIdentifier != null && String(productIdentifier).trim() !== ''; const status = getVariantStatus(item); const currentStock = status.stock; const isOutOfStock = currentStock === 0; const lowStock = currentStock != null && currentStock > 0 && currentStock < item.quantity; const stockLabel = currentStock == null ? 'المخزون غير متاح' : `المتاح حاليًا: ${money(currentStock)} قطعة`;
      return <article className={`cart-line ${isSelected ? 'is-selected' : ''} ${canOpenProduct ? 'is-clickable' : ''} ${(isOutOfStock || lowStock) ? 'is-out-of-stock' : ''}`} key={key} onClick={() => canOpenProduct && openProduct(item)} onKeyDown={(event) => canOpenProduct && cardKeyDown(event, item)} role={canOpenProduct ? 'link' : undefined} tabIndex={canOpenProduct ? 0 : undefined} aria-label={canOpenProduct ? `فتح صفحة ${item.name || 'المنتج'}` : undefined}>
      <button type="button" className="item-select" onClick={(event) => { event.stopPropagation(); toggle(item); }} aria-label={`تحديد ${item.name || 'المنتج'}`} aria-pressed={isSelected}><Check on={isSelected} /></button><div className="item-img"><CartItemImage item={item} /></div><div className="item-body"><div className="item-title-row"><div className="item-title">{item.name || 'منتج بدون اسم'}</div>{editing && <button type="button" className="delete-item" onClick={(event) => { event.stopPropagation(); remove(item); }}>حذف</button>}</div>
      <div className="item-details"><span>💰 سعر الوحدة: <b>{money(item.price)} ج</b></span><span>🧮 الإجمالي: <b>{money(lineTotal)} ج</b></span></div>
      {optionEntries.length > 0 && <div className="item-attrs" aria-label="كل تفاصيل واختيارات المنتج">{optionEntries.map(([name, value]) => { const isOutOption = status.outOptions.has(optionKey(name)); return <span className={`chip ${isOutOption ? 'chip-out' : ''}`} style={isOutOption ? {background:'#fff1f2',borderColor:'#fda4af',color:'#9f1239',fontWeight:800} : undefined} key={`${name}-${value}`}><b>{name}:</b> {String(value)}{isOutOption && <em style={{display:'block',marginTop:3,fontStyle:'normal',fontWeight:900}}>تم نفاذ الكمية</em>}</span>; })}</div>}
      {(color || size) && <div className="item-highlights">{color && <span>🎨 {color}</span>}{size && <span>📏 {size}</span>}</div>}
      <div className="stock-info" role="status" aria-live="polite" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginTop:10,padding:'9px 11px',borderRadius:12,border: isOutOfStock ? '1px solid #fda4af' : lowStock ? '1px solid #fcd34d' : '1px solid #dbeafe',background: isOutOfStock ? '#fff1f2' : lowStock ? '#fffbeb' : '#eff6ff',color: isOutOfStock ? '#9f1239' : lowStock ? '#92400e' : '#1e40af',fontSize:12,fontWeight:900}}><span>📦 {stockLabel}</span>{lowStock && <span>مطلوب: {money(item.quantity)}</span>}{currentStock === 0 && <span>غير متوفر</span>}</div>
      {(isOutOfStock || lowStock) && <div className="stock-warning" role="alert" style={{display:'flex',alignItems:'center',gap:8,padding:'9px 11px',borderRadius:12,border:'1px solid #fda4af',background:'#fff1f2',color:'#9f1239',fontSize:12,fontWeight:900}}><span>⚠</span><b>{isOutOfStock ? 'تم نفاذ الكمية من الاختيار المحدد' : `المتاح الآن ${money(currentStock)} فقط`}</b></div>}
      <div className="item-bottom"><div className="item-price"><span className="now">{money(item.price)} ج</span><small>سعر الوحدة</small></div><div className="qty-box"><button type="button" onClick={(event) => { event.stopPropagation(); decreaseQuantity(item.id, item.variantId ?? null, getOptions(item)); }} disabled={item.quantity <= 1} aria-label="تقليل الكمية">−</button><span aria-live="polite">{money(item.quantity)}</span><button type="button" onClick={(event) => { event.stopPropagation(); if (!isOutOfStock && (currentStock == null || item.quantity < currentStock)) increaseQuantity(item.id, item.variantId ?? null, getOptions(item)); }} disabled={isOutOfStock || lowStock || (currentStock != null && item.quantity >= currentStock)} aria-label="زيادة الكمية">+</button></div></div></div>
    </article>; })}</section>)}
    <div className="checkout-bar" style={getStyle('checkoutBar')}><div className="total-row"><button type="button" className="total-left" onClick={toggleAll}><Check on={allSelected} /><span>إجمالي المنتجات المحددة</span></button><div className="total-price"><b>{money(selectedTotal)} ج</b><small>الشحن والخصم يظهران بالتفصيل عند إتمام الطلب</small></div></div><button type="button" className="checkout-btn" disabled={!selectedItems.length || invalidSelected} onClick={goToCheckout}>{invalidSelected ? 'راجع المخزون أولاً' : `إتمام الشراء (${money(selectedCount)})`}<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button></div>
  </main>;
}
export default CartPage;
