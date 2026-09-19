import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import TrendLiveCard from '../components/TrendLiveCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreLayout } from '../context/StoreLayoutContext';
import './HomePagePremium.css';

function Icon({ type }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'home') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
  if (type === 'grid') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
  if (type === 'trend') return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>;
  if (type === 'cart') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M3 4h2l2.4 11.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6"/></svg>;
  if (type === 'search') return <svg width="16" height="16" viewBox="0 0 24 24" {...c}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (type === 'user') return <svg width="20" height="20" viewBox="0 0 24 24" {...c}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>;
  if (type === 'bag') return <svg width="25" height="25" viewBox="0 0 24 24" {...c}><path d="M6 2l1.5 3h9L18 2"/><path d="M4 8l4-6h8l4 6-3 2v12H7V10z"/></svg>;
  if (type === 'shirt') return <svg width="25" height="25" viewBox="0 0 24 24" {...c}><path d="M4 4l5-2 3 4 3-4 5 2 2 5-4 2v11H6V11L2 9z"/></svg>;
  if (type === 'beauty') return <svg width="25" height="25" viewBox="0 0 24 24" {...c}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>;
  if (type === 'shoe') return <svg width="25" height="25" viewBox="0 0 24 24" {...c}><path d="M4 12l4-8h8l4 8-8 9z"/></svg>;
  return null;
}

function Countdown() {
  return <div className="flash-timer"><span className="box" style={{ width: 'auto', minWidth: '74px', padding: '0 10px', fontSize: '12px' }}>عرض محدود</span></div>;
}

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { productIds, toggleWishlist } = useWishlist();
  const [busy, setBusy] = useState(false);
  const id = product._id || product.id;
  const title = product.nameAr || product.name || 'منتج';
  const price = Number(product.finalPrice ?? product.price ?? 0);
  const old = Number(product.compareAtPrice ?? product.oldPrice ?? 0);
  const image = product.images?.[0] || product.image || product.imageUrl;
  const discount = Number(product.discountAmount || 0);
  const stock = Math.max(0, Number(product.stock ?? product.quantity ?? 0));
  const outOfStock = stock <= 0;
  const liked = productIds.includes(id);
  const add = (e) => {
    e.preventDefault();
    if (!id || outOfStock) return;
    setBusy(true);
    addToCart({ id, name: title, price, oldPrice: old, image, color: '', size: '', store: 'MYBRAND' }, 1);
    setTimeout(() => setBusy(false), 900);
  };
  return <Link to={`/products/${product.slug || id}`} className="card"><div className="card-img" style={{ background: product.bg || '#F3F4F6' }}>{(discount > 0 || old > price) && <span className="off-tag">-{Math.round(discount || ((old - price) / old * 100))}٪</span>}<button type="button" className={`fav-ic ${liked ? 'liked' : ''}`} onClick={(e) => { e.preventDefault(); toggleWishlist(id); }} aria-label="المفضلة">♥</button>{image ? <img src={image} alt={title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="mock-product-icon"><Icon type="bag" /></span>}</div><div className="card-info"><div className="card-title">{title}</div><div className="price-line"><span className="price-now">{price.toLocaleString('ar-EG')}ج</span>{old > price && <span className="price-old">{old.toLocaleString('ar-EG')}ج</span>}</div><div className="rating-line">★ {Number(product.rating || 0).toFixed(1)} ({Number(product.reviewsCount || product.reviewCount || 0).toLocaleString('ar-EG')} تقييم)</div><button type="button" className="home-add-cart" disabled={outOfStock} onClick={add}>{outOfStock ? 'نفد المخزون' : busy ? 'تمت الإضافة ✓' : 'أضف للسلة'}</button></div></Link>;
}

function HomeHero() {
  const [liveStream, setLiveStream] = useState(null); const [checked, setChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try { const { data } = await api.get('/live/active'); if (cancelled) return; const streams = Array.isArray(data?.streams) ? data.streams : (data?.stream ? [data.stream] : []); setLiveStream(streams.find((item) => item?.id && item?.videoUrl) || null); }
      catch { if (!cancelled) setLiveStream(null); }
      finally { if (!cancelled) setChecked(true); }
    };
    load(); const id = setInterval(load, 3000); return () => { cancelled = true; clearInterval(id); };
  }, []);
  return <section className="home-hero home-hero-live-stream" aria-label="عرض الفيديو الحالي"><div className="home-live-card-wrap">{liveStream ? <TrendLiveCard stream={liveStream} /> : checked ? <div className="home-live-empty"><strong>لا يوجد عرض الآن</strong><span>سيظهر الفيديو هنا تلقائيًا عند نشره من المذيع.</span></div> : <div className="home-live-loading"><span>جارٍ تجهيز العرض...</span></div>}</div></section>;
}

function CategoryImages({ categories }) {
  return <section className="home-category-images" aria-label="الأقسام"><div className="sec-title"><h2>الأقسام</h2><Link className="more" to="/categories">عرض الكل</Link></div>{categories.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '16px 10px', padding: '4px 2px 16px' }}>{categories.map((c, i) => { const image = c.image || c.imageUrl || c.coverImage || c.bannerImage || c.thumbnail; const categoryPath = c._id || c.id || c.slug; const categoryTarget = categoryPath ? `/categories?category=${encodeURIComponent(categoryPath)}` : '/categories'; return <Link to={categoryTarget} key={c._id || c.id || i} style={{ minWidth: 0, textAlign: 'center', textDecoration: 'none', color: 'inherit' }}><div style={{ width: '72px', height: '72px', margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.08)', border: '1px solid rgba(0,0,0,.06)' }}>{image ? <img src={image} alt={c.nameAr || c.name || 'قسم'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon type={c.icon || 'bag'} />}</div><span style={{ display: 'block', fontWeight: 700, fontSize: '13px' }}>{c.nameAr || c.name || 'قسم'}</span></Link>; })}</div> : <div className="category-empty">لا توجد أقسام منشورة حاليًا. ستظهر الأقسام هنا تلقائيًا عند إضافتها.</div>}</section>;
}

function StoreSection({ id, style, children }) {
  return <div data-store-layout={id} style={style}>{children}</div>;
}

export default function HomePage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams(); const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState([]); const [searching, setSearching] = useState(false); const [searched, setSearched] = useState(Boolean(searchParams.get('q')));
  const { getStyle } = useStoreLayout('home');
  useEffect(() => { let active = true; api.get('/homepage').then(({ data: result }) => active && setData(result)).catch(() => active && setData({})).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  useEffect(() => { const q = searchParams.get('q') || ''; setSearchInput(q); if (!q) { setSearchResults([]); setSearched(false); return; } let active = true; setSearching(true); api.get('/products', { params: { search: q } }).then(({ data: result }) => active && setSearchResults(result.products || [])).catch(() => active && setSearchResults([])).finally(() => active && setSearching(false)); return () => { active = false; }; }, [searchParams]);
  const submitSearch = async (e) => { e.preventDefault(); const q = searchInput.trim(); if (!q) { setSearchParams({}); return; } setSearchParams({ q }); };
  const clearSearch = () => { setSearchInput(''); setSearchParams({}); };
  const categories = Array.isArray(data?.categories) ? data.categories.filter(Boolean) : [];
  const products = data?.featuredProducts?.length ? data.featuredProducts : (data?.newProducts || []);
  const discounted = data?.discountedProducts || [];
  const section = (id, children) => <StoreSection id={id} style={getStyle(id)}>{children}</StoreSection>;
  return <main className="home-reference" dir="rtl"><div className="app"><header><div className="head-row"><Link to="/" className="logo">MYBRAND</Link><form className="search-pill" onSubmit={submitSearch}><Icon type="search"/><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="فستان صيفي، حذاء رياضي..." aria-label="البحث" autoComplete="off"/><button type="submit" aria-label="بحث">بحث</button></form><Link to="/cart" className="head-icon" aria-label="السلة"><Icon type="cart"/></Link></div></header>
    {(searching || searched) && <section className="home-search-results"><div className="sec-title"><h2>{searching ? 'جاري البحث...' : `نتائج البحث عن «${searchInput}»`}</h2>{searched && !searching && <button type="button" className="more" onClick={clearSearch}>مسح</button>}</div>{!searching && searched && !searchResults.length ? <div className="category-empty">لا توجد منتجات مطابقة. جرّب كلمة أخرى.</div> : !searching && searchResults.length > 0 && <div className="grid">{searchResults.slice(0, 12).map((p) => <ProductCard key={p._id || p.id} product={p}/>)}</div>}</section>}
    <div className="home-layout-sections">
      {section('hero', <HomeHero />)}
      {section('offers', <><section className="flash"><div className="flash-left"><span className="t1">⚡ عروض محدودة</span><span className="t2">الخصومات المتاحة تظهر على المنتجات</span></div><Countdown/></section><div className="tile-row"><Link to="/new-arrivals" className="tile tile-dark"><h4>وصل حديثًا</h4><span>تشكيلة الأسبوع</span></Link><Link to="/offers" className="tile tile-sale"><h4>عروض وخصومات</h4><span>قطع مختارة</span></Link></div></>)}
      {section('categories', <CategoryImages categories={categories}/>)}
      {section('best', <><div className="sec-title"><h2>🔥 الأكثر مبيعًا</h2><Link className="more" to="/categories">عرض الكل</Link></div>{loading ? <div className="grid">{Array.from({ length: 6 }).map((_, i) => <div className="card" key={i}><div className="card-img"/><div className="card-info"><div className="card-title">جاري تحميل المنتج...</div></div></div>)}</div> : products.length ? <div className="grid">{products.slice(0, 8).map((p) => <ProductCard key={p._id || p.id} product={p}/>)}</div> : <div className="category-empty">لا توجد منتجات منشورة حاليًا. أضف المنتجات من لوحة الإدارة.</div>}</>)}
      {section('featured', discounted.length > 0 ? <><div className="sec-title"><h2>⚡ عروض اليوم</h2><Link className="more" to="/offers">عرض الكل</Link></div><div className="grid">{discounted.slice(0, 4).map((p) => <ProductCard key={`d-${p._id || p.id}`} product={p}/>)}</div></> : null)}
      {section('new', <><div className="sec-title"><h2>🆕 وصل حديثًا</h2><Link className="more" to="/new-arrivals">عرض الكل</Link></div>{loading ? <div className="grid">{Array.from({ length: 4 }).map((_, i) => <div className="card" key={`new-${i}`}><div className="card-img"/><div className="card-info"><div className="card-title">جاري تحميل المنتج...</div></div></div>)}</div> : (data?.newProducts || []).length ? <div className="grid">{data.newProducts.slice(0, 4).map((p) => <ProductCard key={`n-${p._id || p.id}`} product={p}/>)}</div> : <div className="category-empty">لا توجد منتجات جديدة حاليًا.</div>}</>)}
      {section('why', <section className="trust-mini home-why"><div><span className="trust-card">✓</span><span>اختيارات متنوعة</span></div><div><span className="trust-return">↩</span><span>إرجاع سهل</span></div><div><Icon type="cart"/><span>شحن ومتابعة</span></div></section>)}
      {section('services', <div className="trust-mini"><div><Icon type="cart"/><span>شحن سريع</span></div><div><span className="trust-return">↩</span><span>إرجاع سهل</span></div><div><span className="trust-card">▣</span><span>دفع آمن</span></div></div>)}
    </div>
    <nav className="bottom-nav"><Link className="nav-item active" to="/"><Icon type="home"/>الرئيسية</Link><Link className="nav-item" to="/categories"><Icon type="grid"/>الأقسام</Link><Link className="nav-item trend" to="/trend"><div className="trend-circle"><Icon type="trend"/></div><span>الترند</span></Link><Link className="nav-item" to="/cart"><Icon type="cart"/>السلة</Link><Link className="nav-item" to="/account"><Icon type="user"/>حسابي</Link></nav>
  </div></main>;
}
