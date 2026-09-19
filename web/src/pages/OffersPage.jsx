import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/client';
import { useCart } from '../context/CartContext';
import './OffersPage.css';
import { useStoreLayout } from '../context/StoreLayoutContext';

const FILTERS = [
  ['all', '🔥 كل العروض'],
  ['10', '⚡ لقطة اليوم'],
  ['20', '💥 خصومات جامدة'],
  ['30', '🤑 أسعار على الآخر'],
  ['50', '🚀 أقوى التخفيضات'],
  ['70', '👑 عروض VIP'],
];

function getDiscount(product) {
  const price = Number(product?.finalPrice ?? product?.price ?? 0);
  const old = Number(product?.compareAtPrice ?? product?.oldPrice ?? 0);
  const direct = Number(product?.discountAmount ?? 0);
  if (direct > 0) return Math.max(0, Math.round(direct));
  if (old > price && old > 0) return Math.max(0, Math.round((1 - price / old) * 100));
  return 0;
}

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const id = product?._id || product?.id;
  const title = product?.nameAr || product?.name || 'منتج';
  const price = Number(product?.finalPrice ?? product?.price ?? 0);
  const old = Number(product?.compareAtPrice ?? product?.oldPrice ?? 0);
  const rawImage = product?.images?.[0] || product?.image || product?.imageUrl;
  const image = rawImage && !/^(https?:|data:|blob:|file:)/i.test(String(rawImage)) ? `${API_ORIGIN}/${String(rawImage).replace(/^\/+/, '')}` : rawImage;
  const stock = Math.max(0, Number(product?.stock ?? product?.quantity ?? 0));
  const outOfStock = stock <= 0;
  const hasOptions = Array.isArray(product?.variants) && product.variants.length > 0;
  const discount = getDiscount(product);
  const add = (event) => {
    event.preventDefault();
    if (!id || outOfStock) return;
    setBusy(true);
    if (hasOptions) { navigate(`/products/${encodeURIComponent(product?.slug || id)}`); setBusy(false); return; }
    addToCart({ id, name: title, price, oldPrice: old, image, color: '', size: '', store: 'MYBRAND' }, 1);
    setTimeout(() => setBusy(false), 900);
  };
  return <Link to={`/products/${product?.slug || id}`} className="offer-product-card">
    <div className="offer-product-image">
      {image ? <img src={image} alt={title} loading="lazy"/> : <span>MY</span>}{outOfStock && <span className="offer-discount">نفد المخزون</span>}
      {discount > 0 && <span className="offer-discount">-{discount}٪</span>}
    </div>
    <div className="offer-product-info">
      <div className="offer-product-title">{title}</div>
      <div className="offer-product-price"><strong>{price.toLocaleString('ar-EG')}ج</strong>{old > price && <del>{old.toLocaleString('ar-EG')}ج</del>}</div>
      <button type="button" disabled={outOfStock} onClick={add}>{outOfStock ? 'نفد المخزون' : busy ? 'تمت الإضافة ✓' : hasOptions ? 'اختر الخيارات' : 'أضف للسلة'}</button>
    </div>
  </Link>;
}

export default function OffersPage() {
  const { getStyle } = useStoreLayout('offers');
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/homepage').then(({ data }) => {
      if (!alive) return;
      const list = Array.isArray(data?.discountedProducts) ? data.discountedProducts.filter(Boolean) : [];
      setProducts(list.sort((a, b) => getDiscount(b) - getDiscount(a)));
    }).catch(() => alive && setError('تعذر تحميل العروض حاليًا.')).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const visibleProducts = useMemo(() => filter === 'all' ? products : products.filter(product => getDiscount(product) >= Number(filter)), [products, filter]);
  const countLabel = visibleProducts.length.toLocaleString('ar-EG');

  return <main className="offers-page" dir="rtl">
    <header className="offers-header" style={getStyle('header')}>
      <Link to="/" className="offers-back">←</Link>
      <div><strong>🏷️ عروض وخصومات</strong><span>أفضل الأسعار المختارة</span></div>
      <Link to="/cart" className="offers-cart">🛒</Link>
    </header>

    <section className="offers-hero" style={getStyle('hero')}>
      <div><span className="offers-kicker">🔥 لفترة محدودة</span><h1>عروض وخصومات</h1><p>لقطات حلوة وأسعار أقوى — اختار عرضك وخد أفضل سعر على MYBRAND.</p></div>
      {!loading && !error && <strong className="offers-count">{products.length.toLocaleString('ar-EG')} عرض</strong>}
    </section>

    <div className="offers-filters" style={getStyle('filters')} aria-label="تصنيفات العروض">
      {FILTERS.map(([value, label]) => <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}
    </div>

    {!loading && !error && <div className="offers-results-line"><strong>{countLabel}</strong> منتج في الاختيار ده</div>}

    {error ? <div className="offers-empty">{error}</div> : loading ? <div className="offers-grid" style={getStyle('products')}>{Array.from({ length: 8 }).map((_, i) => <div className="offers-skeleton" key={i}/>)}</div> : visibleProducts.length ? <div className="offers-grid" style={getStyle('products')}>{visibleProducts.map(product => <ProductCard key={product._id || product.id || product.slug} product={product}/>)}</div> : <div className="offers-empty"><strong>مفيش عروض في الاختيار ده 😅</strong><span>جرّب اختيار تاني وشوف أقوى اللقطات.</span><button type="button" onClick={() => setFilter('all')}>🔥 شوف كل العروض</button></div>}
  </main>;
}
