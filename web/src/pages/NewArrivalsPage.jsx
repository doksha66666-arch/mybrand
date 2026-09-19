import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import './NewArrivalsPage.css';

function ProductCard({ product, merchantId = '' }) {
  const { addToCart } = useCart();
  const [busy, setBusy] = useState(false);
  const id = product?._id || product?.id;
  const title = product?.nameAr || product?.name || 'منتج';
  const price = Number(product?.finalPrice ?? product?.price ?? 0);
  const old = Number(product?.compareAtPrice ?? product?.oldPrice ?? 0);
  const image = product?.images?.[0] || product?.image || product?.imageUrl;
  const add = (event) => { event.preventDefault(); if (!id) return; setBusy(true); addToCart({ id, name: title, price, oldPrice: old, image, color: '', size: '', store: 'MYBRAND' }, 1); setTimeout(() => setBusy(false), 900); };
  const target = `/products/${product?.slug || id}${merchantId ? `?merchant=${encodeURIComponent(merchantId)}` : ''}`;
  return <Link to={target} className="new-product-card">
    <div className="new-product-image">{image ? <img src={image} alt={title} loading="lazy"/> : <span>MY</span>}{old > price && <span className="new-product-discount">-{Math.round((1 - price / old) * 100)}٪</span>}</div>
    <div className="new-product-info"><div className="new-product-title">{title}</div><div className="new-product-price"><strong>{price.toLocaleString('ar-EG')}ج</strong>{old > price && <del>{old.toLocaleString('ar-EG')}ج</del>}</div><button type="button" onClick={add}>{busy ? 'تمت الإضافة ✓' : 'أضف للسلة'}</button></div>
  </Link>;
}

export default function NewArrivalsPage() {
  const [searchParams] = useSearchParams();
  const merchantId = searchParams.get('merchant') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let alive = true; api.get('/homepage', { params: merchantId ? { merchant: merchantId } : undefined }).then(({ data }) => { if (!alive) return; const list = Array.isArray(data?.newProducts) ? data.newProducts.filter(Boolean) : []; setProducts(list.sort((a,b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())); }).catch(() => alive && setError('تعذر تحميل المنتجات الجديدة حاليًا.')).finally(() => alive && setLoading(false)); return () => { alive = false; }; }, [merchantId]);
  const countLabel = useMemo(() => products.length.toLocaleString('ar-EG'), [products.length]);
  return <main className="new-arrivals-page" dir="rtl">
    <header className="new-arrivals-header"><Link to={merchantId?`/?merchant=${encodeURIComponent(merchantId)}`:'/'} className="new-arrivals-back">←</Link><div><strong>✨ وصل حديثًا</strong><span>أحدث المنتجات المنشورة</span></div><Link to="/cart" className="new-arrivals-cart">🛒</Link></header>
    <section className="new-arrivals-hero"><h1>وصل حديثًا</h1><p>أحدث المنتجات المنشورة والمقبولة على MYBRAND، مرتبة من الأحدث إلى الأقدم.</p>{!loading && !error && <span>{countLabel} منتج</span>}</section>
    {error ? <div className="new-arrivals-empty">{error}</div> : loading ? <div className="new-arrivals-grid">{Array.from({length:8}).map((_,i)=><div className="new-arrivals-skeleton" key={i}/>)}</div> : products.length ? <div className="new-arrivals-grid">{products.map(product => <ProductCard key={product._id || product.id || product.slug} product={product} merchantId={merchantId}/>)}</div> : <div className="new-arrivals-empty"><strong>لا توجد منتجات جديدة حاليًا</strong><span>ستظهر هنا تلقائيًا عند نشر وقبول منتجات جديدة.</span><Link to={merchantId?`/?merchant=${encodeURIComponent(merchantId)}`:'/'}>العودة للرئيسية</Link></div>}
  </main>;
}
