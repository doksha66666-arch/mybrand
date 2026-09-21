import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreLayout } from '../context/StoreLayoutContext';
import './SearchPage.css';

const hasPurchasableVariant = (p) => Array.isArray(p?.variants) && p.variants.length > 0 && p.variants.some((variant) => Number(variant?.stock ?? 0) > 0);

const imageOf = (p) => {
  const value = p?.images?.[0] || p?.image || p?.imageUrl || p?.thumbnail || '';
  if (!value) return '';
  if (/^(https?:|data:|blob:|file:)/i.test(String(value))) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `${API_ORIGIN}/${String(value).replace(/^\/+/, '')}`;
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { getStyle } = useStoreLayout('products');
  const initial = params.get('q') || '';
  const [query, setQuery] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(initial));
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const next = params.get('q') || '';
    setQuery(next);
    setSubmitted(next);
  }, [params]);

  useEffect(() => {
    let active = true;
    const value = submitted.trim();
    if (!value) { setProducts([]); setPage(1); setPages(1); setLoading(false); setError(''); return undefined; }
    setLoading(true); setLoadingMore(false); setPage(1); setPages(1); setProducts([]); setError('');
    api.get('/products', { params: { search: value, q: value, limit: 40, page: 1, pricing: 1 } })
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setProducts(list);
        setPage(1);
        setPages(Math.max(1, Number(data?.pages) || 1));
      })
      .catch(() => active && setError('تعذر تحميل نتائج البحث. حاول مرة أخرى.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [submitted]);

  const title = useMemo(() => submitted ? `نتائج البحث عن «${submitted}»` : 'ابحث عن منتج', [submitted]);

  const loadMore = async () => {
    const value = submitted.trim();
    if (!value || loading || loadingMore || page >= pages) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const { data } = await api.get('/products', { params: { search: value, q: value, limit: 40, page: nextPage, pricing: 1 } });
      const incoming = Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setProducts((current) => {
        const seen = new Set(current.map((item) => String(item?._id || item?.id || item?.productId || '')));
        return [...current, ...incoming.filter((item) => {
          const id = String(item?._id || item?.id || item?.productId || '');
          return id && !seen.has(id);
        })];
      });
      setPage(nextPage);
      setPages(Math.max(nextPage, Number(data?.pages) || nextPage));
    } catch {
      setError('تعذر تحميل المزيد من نتائج البحث. حاول مرة أخرى.');
    } finally {
      setLoadingMore(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const value = query.trim();
    setParams(value ? { q: value } : {});
  };

  return <main className="search-reference" dir="rtl">
    <div className="search-page">
      <header className="search-header" style={getStyle('topbar')}>
        <Link to="/" className="search-back" aria-label="العودة">‹</Link>
        <h1>{title}</h1>
        <Link to="/cart" className="search-cart">السلة</Link>
      </header>
      <form className="search-form" onSubmit={submit}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن منتج أو قسم..." aria-label="البحث" autoFocus />
        <button type="submit">بحث</button>
      </form>
      {!submitted && <div className="search-empty"><div className="search-empty-icon">⌕</div><h2>ابدأ البحث</h2><p>اكتب اسم المنتج أو الكلمة التي تبحث عنها.</p></div>}
      {loading && <div className="search-state">جاري البحث...</div>}
      {error && <div className="search-state error">{error}</div>}
      {!loading && !error && submitted && products.length === 0 && <div className="search-empty"><div className="search-empty-icon">⌕</div><h2>لا توجد نتائج</h2><p>جرّب كلمة أخرى أو تصفح الأقسام.</p><Link to="/categories">تصفح الأقسام</Link></div>}
      {!loading && !error && products.length > 0 && <section className="search-results" aria-label="نتائج البحث">
        {products.map((p) => {
          const id = p._id || p.id || p.productId;
          const slug = p.slug || id;
          const image = imageOf(p);
          const price = Number(p.finalPrice ?? p.price ?? 0);
          const old = Number(p.compareAtPrice ?? p.oldPrice ?? 0);
          const out = Array.isArray(p.variants) && p.variants.length > 0
    ? !hasPurchasableVariant(p)
    : Number(p.stock ?? p.quantity ?? 0) <= 0;
          const liked = id != null && isWishlisted(id);
          const hasOptions = Array.isArray(p.variants) && p.variants.length > 0;
          return <article className="search-card" key={id}>
            <Link to={`/products/${encodeURIComponent(slug)}`} className="search-image">{image ? <img src={image} alt={p.nameAr || p.name || 'منتج'} loading="lazy" /> : <span>MYBRAND</span>}{out && <b>نفد المخزون</b>}</Link>
            <div className="search-info">
              <div className="search-card-top"><Link to={`/products/${encodeURIComponent(slug)}`} className="search-name">{p.nameAr || p.name || p.nameEn || 'منتج'}</Link><button type="button" className={liked ? 'liked' : ''} onClick={() => id != null && toggleWishlist(id)} aria-label={liked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}>{liked ? '♥' : '♡'}</button></div>
              <div className="search-price">{price.toLocaleString('ar-EG')} ج{old > price && <del>{old.toLocaleString('ar-EG')} ج</del>}</div>
              <button type="button" className="search-add" disabled={out} onClick={() => hasOptions ? navigate(`/products/${encodeURIComponent(slug)}`) : addToCart({ ...p, id, price, oldPrice: old, image })}>{out ? 'غير متوفر' : hasOptions ? 'اختر الخيارات' : 'أضف للسلة'}</button>
            </div>
          </article>;
        })}
      </section>}
      {!loading && !error && submitted && pages > page && <div className="search-more-wrap"><button type="button" className="search-load-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'جاري تحميل المزيد...' : `عرض المزيد — ${page} من ${pages}`}</button></div>}
    </div>
  </main>;
}
