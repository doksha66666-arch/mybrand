import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/client';
import { useCart } from '../context/CartContext';
import './NewArrivalsPage.css';
import { useStoreLayout } from '../context/StoreLayoutContext';

const hasPurchasableVariant = (product) => Array.isArray(product?.variants) && product.variants.length > 0 && product.variants.some((variant) => Number(variant?.stock ?? 0) > 0);

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
  const hasOptions = Array.isArray(product?.variants) && product.variants.length > 0;
  const outOfStock = hasOptions ? !hasPurchasableVariant(product) : stock <= 0;
  const add = (event) => { event.preventDefault(); if (!id || outOfStock) return; setBusy(true); if (hasOptions) { navigate(`/products/${encodeURIComponent(product?.slug || id)}`); setBusy(false); return; } addToCart({ id, name: title, price, oldPrice: old, image, color: '', size: '', store: 'MYBRAND' }, 1); setTimeout(() => setBusy(false), 900); };
  return <Link to={`/products/${product?.slug || id}`} className="new-product-card">
    <div className="new-product-image">{image ? <img src={image} alt={title} loading="lazy"/> : <span>MY</span>}{old > price && <span className="new-product-discount">-{Math.round((1 - price / old) * 100)}٪</span>}</div>
    <div className="new-product-info"><div className="new-product-title">{title}</div><div className="new-product-price"><strong>{price.toLocaleString('ar-EG')}ج</strong>{old > price && <del>{old.toLocaleString('ar-EG')}ج</del>}</div><button type="button" disabled={outOfStock} onClick={add}>{outOfStock ? 'نفد المخزون' : busy ? 'تمت الإضافة ✓' : hasOptions ? 'اختر الخيارات' : 'أضف للسلة'}</button></div>
  </Link>;
}

export default function NewArrivalsPage() {
  const { getStyle } = useStoreLayout('new-arrivals');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true); setPage(1); setPages(1); setProducts([]); setError('');
    api.get('/products', { params: { limit: 40, page: 1 } })
      .then(({ data }) => {
        if (!alive) return;
        const list = Array.isArray(data?.products) ? data.products.filter(Boolean) : [];
        setProducts(list);
        setPage(1);
        setPages(Math.max(1, Number(data?.pages) || 1));
      })
      .catch(() => alive && setError('تعذر تحميل المنتجات الجديدة حاليًا.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);
  const loadMore = async () => {
    if (loading || loadingMore || page >= pages) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const { data } = await api.get('/products', { params: { limit: 40, page: nextPage } });
      const incoming = Array.isArray(data?.products) ? data.products.filter(Boolean) : [];
      setProducts((current) => {
        const seen = new Set(current.map((item) => String(item?._id || item?.id || item?.slug || '')));
        return [...current, ...incoming.filter((item) => {
          const id = String(item?._id || item?.id || item?.slug || '');
          return id && !seen.has(id);
        })];
      });
      setPage(nextPage);
      setPages(Math.max(nextPage, Number(data?.pages) || nextPage));
    } catch {
      setError('تعذر تحميل المزيد من المنتجات الجديدة. حاول مرة أخرى.');
    } finally {
      setLoadingMore(false);
    }
  };
  const countLabel = useMemo(() => products.length.toLocaleString('ar-EG'), [products.length]);
  return <main className="new-arrivals-page" dir="rtl">
    <header className="new-arrivals-header" style={getStyle('header')}><Link to="/" className="new-arrivals-back">←</Link><div><strong>✨ وصل حديثًا</strong><span>أحدث المنتجات المنشورة</span></div><Link to="/cart" className="new-arrivals-cart">🛒</Link></header>
    <section className="new-arrivals-hero" style={getStyle('hero')}><h1>وصل حديثًا</h1><p>أحدث المنتجات المنشورة والمقبولة على MYBRAND، مرتبة من الأحدث إلى الأقدم.</p>{!loading && !error && <span>{countLabel} منتج</span>}</section>
    {error ? <div className="new-arrivals-empty">{error}</div> : loading ? <div className="new-arrivals-grid" style={getStyle('products')}>{Array.from({length:8}).map((_,i)=><div className="new-arrivals-skeleton" key={i}/>)}</div> : products.length ? <><div className="new-arrivals-grid" style={getStyle('products')}>{products.map(product => <ProductCard key={product._id || product.id || product.slug} product={product}/>)}</div>{pages > page && <div className="new-arrivals-more-wrap"><button type="button" className="new-arrivals-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'جاري تحميل المزيد...' : `عرض المزيد — ${page} من ${pages}`}</button></div>}</> : <div className="new-arrivals-empty"><strong>لا توجد منتجات جديدة حاليًا</strong><span>ستظهر هنا تلقائيًا عند نشر وقبول منتجات جديدة.</span><Link to="/">العودة للرئيسية</Link></div>}
  </main>;
}
