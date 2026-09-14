import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const labels = { draft: 'مسودة', pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض', hidden: 'مخفي', out_of_stock: 'نفد المخزون' };

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/admin/all', { params: { limit: 200 } });
      setProducts(response.data.products || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المنتج نهائيًا؟')) return;
    try { await api.delete(`/products/${id}`); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'تعذر حذف المنتج'); }
  };

  const approve = async (id, action) => {
    try { await api.put(`/products/${id}/review`, { action }); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'تعذر تحديث مراجعة المنتج'); }
  };

  const filtered = useMemo(() => products.filter(product => {
    const text = `${product.nameAr || ''} ${product.nameEn || ''} ${product.slug || ''} ${product.sku || ''}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (status === 'all' || product.status === status);
  }), [products, search, status]);

  return <div dir="rtl" style={styles.page}>
    <header style={styles.header}>
      <div><h1 style={styles.h1}>المنتجات</h1><p style={styles.muted}>إدارة المنتجات ومراجعتها من مكان واحد. إنشاء المنتج أصبح في صفحة مستقلة لتجنب التكرار.</p></div>
      <div style={styles.headerActions}>
        <button type="button" style={styles.primary} onClick={() => navigate('/products/add')}>+ إضافة منتج</button>
      </div>
    </header>
    {error && <div style={styles.error}>{error}</div>}
    <section style={styles.toolbar}>
      <input style={styles.search} placeholder="ابحث باسم المنتج أو Slug أو SKU..." value={search} onChange={e => setSearch(e.target.value)} />
      <select style={styles.select} value={status} onChange={e => setStatus(e.target.value)}>
        <option value="all">كل الحالات</option><option value="approved">معتمد</option><option value="pending">قيد المراجعة</option><option value="draft">مسودة</option><option value="hidden">مخفي</option><option value="rejected">مرفوض</option><option value="out_of_stock">نفد المخزون</option>
      </select>
      <span style={styles.count}>{filtered.length} منتج</span>
    </section>
    {loading ? <div style={styles.empty}>جارٍ تحميل المنتجات...</div> : !filtered.length ? <div style={styles.empty}><strong>لا توجد منتجات مطابقة.</strong><button type="button" style={styles.secondary} onClick={() => navigate('/products/add')}>إضافة أول منتج</button></div> :
      <div style={styles.grid}>{filtered.map(product => <article key={product._id} style={styles.card}>
        <div style={styles.cardTop}>{product.images?.[0] ? <img src={product.images[0]} alt="" style={styles.thumb} /> : <div style={styles.noimg}>بدون صورة</div>}<div style={{ flex: 1, minWidth: 0 }}><b style={styles.name}>{product.nameAr || product.nameEn || 'منتج بدون اسم'}</b><div style={styles.small}>{product.nameEn || '—'}</div><div style={styles.small}>SKU: {product.sku || '—'}</div></div><span style={styles.badge}>{labels[product.status] || product.status || 'غير محدد'}</span></div>
        <div style={styles.stats}><span>السعر <b>{Number(product.price || 0).toLocaleString('ar-EG')} ج.م</b></span><span>المخزون <b>{Number(product.stock || 0)}</b></span><span>الألوان <b>{product.variants?.filter(v => v.name === 'color').length || 0}</b></span><span>المقاسات <b>{product.variants?.filter(v => v.name === 'size').length || 0}</b></span></div>
        <div style={styles.cardActions}><button type="button" style={styles.secondary} onClick={() => navigate(`/products/edit/${product._id}`)}>تعديل</button>{product.status === 'pending' && <><button type="button" style={styles.approve} onClick={() => approve(product._id, 'approve')}>اعتماد</button><button type="button" style={styles.reject} onClick={() => approve(product._id, 'reject')}>رفض</button></>}<button type="button" style={styles.danger} onClick={() => remove(product._id)}>حذف</button></div>
      </article>)}</div>}
  </div>;
}

const styles = {
  page:{maxWidth:1250,margin:'0 auto',padding:'8px 4px 40px'},header:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,marginBottom:20,flexWrap:'wrap'},headerActions:{display:'flex',gap:9,alignItems:'center',flexWrap:'wrap'},h1:{margin:'0 0 6px',fontSize:30},muted:{color:'#64748B',fontSize:14,margin:0},toolbar:{background:'#fff',padding:14,borderRadius:14,display:'flex',gap:10,alignItems:'center',marginBottom:14,boxShadow:'0 2px 10px rgba(15,23,42,.05)',flexWrap:'wrap'},search:{flex:1,minWidth:260,padding:11,border:'1px solid #CBD5E1',borderRadius:9,boxSizing:'border-box'},select:{padding:11,border:'1px solid #CBD5E1',borderRadius:9,background:'#fff'},count:{color:'#64748B',fontSize:13,fontWeight:700},grid:{display:'grid',gap:12},card:{background:'#fff',padding:16,borderRadius:14,boxShadow:'0 2px 10px rgba(15,23,42,.05)'},cardTop:{display:'flex',gap:12,alignItems:'center'},thumb:{width:72,height:72,objectFit:'cover',borderRadius:10},noimg:{width:72,height:72,borderRadius:10,background:'#F1F5F9',display:'grid',placeItems:'center',color:'#64748B',fontSize:11},name:{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},small:{color:'#64748B',fontSize:12,marginTop:3},badge:{padding:'5px 9px',borderRadius:999,background:'#F1F5F9',fontSize:11,whiteSpace:'nowrap'},stats:{display:'flex',gap:18,flexWrap:'wrap',padding:'13px 0',marginTop:12,borderTop:'1px solid #E2E8F0',borderBottom:'1px solid #E2E8F0',fontSize:12,color:'#64748B'},cardActions:{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'},primary:{padding:'11px 18px',border:0,borderRadius:9,background:'#0F172A',color:'#fff',fontWeight:800,cursor:'pointer'},secondary:{padding:'9px 14px',border:'1px solid #CBD5E1',borderRadius:9,background:'#fff',cursor:'pointer'},danger:{padding:'9px 14px',border:0,borderRadius:9,background:'#FEE2E2',color:'#B91C1C',cursor:'pointer'},approve:{padding:'9px 14px',border:0,borderRadius:9,background:'#DCFCE7',color:'#166534',cursor:'pointer'},reject:{padding:'9px 14px',border:0,borderRadius:9,background:'#FEF3C7',color:'#92400E',cursor:'pointer'},error:{padding:12,background:'#FEF2F2',color:'#B91C1C',borderRadius:9,marginBottom:14},empty:{padding:35,background:'#fff',borderRadius:14,display:'flex',justifyContent:'center',alignItems:'center',gap:14,flexDirection:'column',color:'#64748B'}
};
