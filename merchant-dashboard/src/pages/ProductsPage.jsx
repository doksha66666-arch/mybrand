import React, { useEffect, useState } from 'react';
import api from '../api/client';
import ImageUploader from '../components/ImageUploader';
import VideoUploader from '../components/VideoUploader';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import './MerchantProducts.css';

const emptyForm = {
  nameAr: '', nameEn: '', slug: '', price: '', compareAtPrice: '', category: '', stock: 0,
  descriptionAr: '', images: [], videoUrl: '', variants: []
};

const statusLabels = {
  draft: 'مسودة', pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض',
  hidden: 'مخفي', out_of_stock: 'نفد المخزون'
};

const statusColors = {
  draft: { background: '#F1F5F9', color: '#64748B' },
  pending: { background: '#FEF3C7', color: '#B45309' },
  approved: { background: '#DCFCE7', color: '#16A34A' },
  rejected: { background: '#FEE2E2', color: '#DC2626' },
  hidden: { background: '#F1F5F9', color: '#64748B' },
  out_of_stock: { background: '#FEE2E2', color: '#DC2626' }
};

export default function ProductsPage() {
  const { merchant } = useMerchantAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const approved = merchant?.status === 'approved';
  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products/mine'),
        api.get('/categories')
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
      setError('');
    } catch (e) {
      setError(e?.response?.data?.message || 'تعذر تحميل المنتجات');
    }
  };

  useEffect(() => { load(); }, []);

  const addVariant = (type) => {
    const variant = type === 'color'
      ? { name: 'color', value: '', image: '', stock: 0, priceModifier: 0 }
      : { name: 'size', value: '', stock: 0, sku: '', priceModifier: 0 };
    change('variants', [...form.variants, variant]);
  };

  const updateVariant = (index, key, value) => {
    change('variants', form.variants.map((variant, i) => (
      i === index ? { ...variant, [key]: value } : variant
    )));
  };

  const removeVariant = (index) => {
    change('variants', form.variants.filter((_, i) => i !== index));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const variants = form.variants
        .filter((variant) => String(variant.value || '').trim())
        .map((variant) => ({
          ...variant,
          value: String(variant.value).trim(),
          stock: Number(variant.stock || 0),
          priceModifier: Number(variant.priceModifier || 0)
        }));
      const payload = {
        ...form,
        variants,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
        stock: Number(form.stock || 0)
      };
      if (editingId) await api.put(`/products/${editingId}`, payload);
      else await api.post('/products', payload);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setSaving(false);
    }
  };

  const edit = (product) => {
    setEditingId(product._id);
    setForm({
      ...emptyForm,
      ...product,
      compareAtPrice: product.compareAtPrice ?? '',
      category: product.category?._id || product.category || '',
      variants: product.variants || []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المنتج؟')) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'تعذر حذف المنتج');
    }
  };

  const filtered = products.filter((product) => {
    const text = `${product.nameAr || ''} ${product.nameEn || ''} ${product.slug || ''}`.toLowerCase();
    return !search || text.includes(search.toLowerCase());
  });

  const colors = form.variants.filter((variant) => variant.name === 'color');
  const sizes = form.variants.filter((variant) => variant.name === 'size');

  return (
    <div dir="rtl" className="merchant-products-page" style={styles.page}>
      <header className="merchant-products-header" style={styles.header}>
        <div className="merchant-products-heading">
          <h1 style={styles.h1}>منتجاتي</h1>
          <p style={styles.sub}>إدارة منتجاتك بسهولة واحترافية من مكان واحد.</p>
        </div>
        {approved && (
          <button type="button" style={styles.primary} onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm((value) => !value);
          }}>
            {showForm ? 'إلغاء' : '＋ إضافة منتج'}
          </button>
        )}
      </header>

      {!approved && <div style={styles.notice}>سيظهر لك إضافة المنتجات بعد اعتماد حساب التاجر من الإدارة.</div>}

      {showForm && approved && (
        <form className="merchant-products-form" onSubmit={submit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <Section title="المعلومات الأساسية">
            <div className="merchant-products-grid2" style={styles.grid2}>
              <input style={styles.input} placeholder="اسم المنتج بالعربي" value={form.nameAr} onChange={(e) => change('nameAr', e.target.value)} required />
              <input style={styles.input} placeholder="اسم المنتج بالإنجليزي" value={form.nameEn} onChange={(e) => change('nameEn', e.target.value)} required />
              <input style={styles.input} placeholder="Slug" value={form.slug} onChange={(e) => change('slug', e.target.value)} required />
              <select style={styles.input} value={form.category} onChange={(e) => change('category', e.target.value)} required>
                <option value="">اختر القسم</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.nameAr}</option>)}
              </select>
              <input style={styles.input} type="number" min="0" step="0.01" placeholder="السعر الحالي" value={form.price} onChange={(e) => change('price', e.target.value)} required />
              <input style={styles.input} type="number" min="0" step="0.01" placeholder="السعر قبل الخصم" value={form.compareAtPrice} onChange={(e) => change('compareAtPrice', e.target.value)} />
              <input style={styles.input} type="number" min="0" placeholder="المخزون العام" value={form.stock} onChange={(e) => change('stock', e.target.value)} />
            </div>
            <p style={styles.priceHint}>اكتب السعر الحالي للبيع، والسعر قبل الخصم لإظهار قيمة الخصم للعميل.</p>
          </Section>

          <Section title="صور المنتج والفيديو">
            <ImageUploader images={form.images || []} onChange={(value) => change('images', value)} />
            <VideoUploader value={form.videoUrl || ''} onChange={(value) => change('videoUrl', value)} />
          </Section>

          <Section title="ألوان المنتج" action={<button type="button" style={styles.add} onClick={() => addVariant('color')}>＋ إضافة لون</button>}>
            <p style={styles.hint}>لكل لون صورة ومخزون مستقل حتى يتم حساب المتاح بدقة.</p>
            {colors.map((variant) => {
              const index = form.variants.indexOf(variant);
              return (
                <div className="merchant-product-color-row" style={styles.color} key={index}>
                  <div>
                    <label style={styles.label}>اسم اللون</label>
                    <input style={styles.input} placeholder="أسود" value={variant.value} onChange={(e) => updateVariant(index, 'value', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.label}>مخزون اللون</label>
                    <input style={styles.input} type="number" min="0" placeholder="0" value={variant.stock ?? 0} onChange={(e) => updateVariant(index, 'stock', e.target.value)} />
                  </div>
                  <div className="merchant-product-color-image">
                    <label style={styles.label}>صورة اللون</label>
                    <ImageUploader images={variant.image ? [variant.image] : []} onChange={(value) => updateVariant(index, 'image', value[0] || '')} />
                  </div>
                  <button type="button" style={styles.remove} onClick={() => removeVariant(index)}>حذف اللون</button>
                </div>
              );
            })}
            {!colors.length && <Empty text="أضف الألوان المتاحة وحدد مخزون كل لون." />}
          </Section>

          <Section title="مقاسات المنتج" action={<button type="button" style={styles.add} onClick={() => addVariant('size')}>＋ إضافة مقاس</button>}>
            <p style={styles.hint}>حدد المخزون وSKU والسعر الإضافي لكل مقاس.</p>
            {sizes.map((variant) => {
              const index = form.variants.indexOf(variant);
              return (
                <div className="merchant-product-size-row" style={styles.size} key={index}>
                  <input style={styles.input} placeholder="S / M / L / XL أو 36 / 38" value={variant.value} onChange={(e) => updateVariant(index, 'value', e.target.value)} />
                  <input style={styles.input} type="number" min="0" placeholder="المخزون" value={variant.stock ?? 0} onChange={(e) => updateVariant(index, 'stock', e.target.value)} />
                  <input style={styles.input} placeholder="SKU" value={variant.sku || ''} onChange={(e) => updateVariant(index, 'sku', e.target.value)} />
                  <input style={styles.input} type="number" step="0.01" placeholder="تعديل السعر" value={variant.priceModifier ?? 0} onChange={(e) => updateVariant(index, 'priceModifier', e.target.value)} />
                  <button type="button" style={styles.remove} onClick={() => removeVariant(index)}>×</button>
                </div>
              );
            })}
            {!sizes.length && <Empty text="أضف المقاسات المتاحة للمنتج." />}
          </Section>

          <textarea style={styles.textarea} placeholder="وصف المنتج" value={form.descriptionAr} onChange={(e) => change('descriptionAr', e.target.value)} />
          <p style={styles.note}>سيتم إرسال المنتج لمراجعة الإدارة قبل ظهوره في المتجر.</p>
          <button disabled={saving} style={styles.save} type="submit">{saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ وإعادة الإرسال للمراجعة' : 'إضافة المنتج'}</button>
        </form>
      )}

      <div className="merchant-products-list" style={styles.list}>
        <div className="merchant-products-list-head" style={styles.listHead}>
          <div><h2>منتجاتي</h2><span style={styles.count}>{filtered.length} منتج</span></div>
          <input className="merchant-products-search" style={styles.search} placeholder="ابحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="merchant-products-cards" style={styles.cards}>
          {filtered.map((product) => (
            <article key={product._id} style={styles.card}>
              {product.images?.[0] ? <img src={product.images[0]} alt="" style={styles.thumb} /> : <div style={styles.thumbEmpty}>بدون صورة</div>}
              <div style={styles.body}>
                <div style={styles.cardTitle}><b>{product.nameAr}</b><span style={{ ...styles.badge, ...(statusColors[product.status] || {}) }}>{statusLabels[product.status] || product.status}</span></div>
                <div style={styles.price}>{product.price} ج.م</div>
                {product.compareAtPrice != null && Number(product.compareAtPrice) > Number(product.price) && <div style={styles.oldPrice}>قبل الخصم: {product.compareAtPrice} ج.م</div>}
                <div style={styles.meta}>المخزون العام: {product.stock ?? 0}</div>
                {product.variants?.filter((v) => v.name === 'color').map((v, i) => <div key={`c-${i}`} style={styles.variantMeta}>اللون {v.value}: {v.stock ?? 0} قطعة</div>)}
                <div style={styles.meta}>الألوان: {product.variants?.filter((v) => v.name === 'color').length || 0} • المقاسات: {product.variants?.filter((v) => v.name === 'size').length || 0}</div>
                <div style={styles.actions}><button type="button" style={styles.edit} onClick={() => edit(product)}>تعديل</button><button type="button" style={styles.remove} onClick={() => remove(product._id)}>حذف</button></div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p style={styles.noProducts}>لا توجد منتجات بعد.</p>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return <section style={styles.section}><div style={styles.sectionHead}><h2>{title}</h2>{action}</div>{children}</section>;
}

function Empty({ text }) {
  return <div style={styles.empty}>{text}</div>;
}

const styles = {
  page: { maxWidth: 1250, margin: '0 auto', padding: '10px 4px 40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 22 },
  h1: { margin: 0, fontSize: 30 },
  sub: { margin: '6px 0', color: '#64748B' },
  primary: { border: 0, borderRadius: 10, padding: '12px 18px', background: '#0F172A', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  notice: { padding: 14, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, color: '#9A3412', marginBottom: 18 },
  form: { background: '#fff', padding: 22, borderRadius: 18, boxShadow: '0 5px 22px rgba(15,23,42,.07)', marginBottom: 28 },
  section: { border: '1px solid #E2E8F0', borderRadius: 14, padding: 18, marginBottom: 14 },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 },
  input: { width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: '1px solid #CBD5E1', borderRadius: 9, outline: 'none' },
  priceHint: { fontSize: 12, color: '#64748B', margin: '10px 0 0' },
  add: { padding: '9px 13px', border: '1px solid #CBD5E1', background: '#fff', borderRadius: 9, fontWeight: 800, cursor: 'pointer' },
  hint: { fontSize: 12, color: '#64748B' },
  label: { display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' },
  color: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: 14, alignItems: 'end', padding: 14, border: '1px solid #E2E8F0', borderRadius: 12, marginTop: 10 },
  size: { display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr auto', gap: 9, alignItems: 'center', padding: 10, border: '1px solid #E2E8F0', borderRadius: 12, marginTop: 9 },
  remove: { border: 0, borderRadius: 8, padding: '9px 12px', background: '#FEE2E2', color: '#B91C1C', cursor: 'pointer', whiteSpace: 'nowrap' },
  empty: { padding: 15, background: '#F8FAFC', borderRadius: 9, color: '#64748B', fontSize: 13 },
  textarea: { width: '100%', minHeight: 110, boxSizing: 'border-box', padding: 12, border: '1px solid #CBD5E1', borderRadius: 9, marginBottom: 12 },
  note: { fontSize: 12, color: '#64748B' },
  save: { border: 0, borderRadius: 10, padding: '12px 22px', background: '#0F172A', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  error: { padding: 12, background: '#FEF2F2', color: '#B91C1C', borderRadius: 9, marginBottom: 14 },
  list: { marginTop: 25 },
  listHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, marginBottom: 14 },
  count: { fontSize: 12, color: '#64748B' },
  search: { padding: 11, border: '1px solid #CBD5E1', borderRadius: 9, minWidth: 280 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 14 },
  card: { background: '#fff', borderRadius: 15, overflow: 'hidden', boxShadow: '0 3px 15px rgba(15,23,42,.06)', border: '1px solid #EEF2F7' },
  thumb: { width: '100%', height: 180, objectFit: 'cover' },
  thumbEmpty: { height: 180, display: 'grid', placeItems: 'center', background: '#F8FAFC', color: '#94A3B8' },
  body: { padding: 15 },
  cardTitle: { display: 'flex', justifyContent: 'space-between', gap: 8 },
  badge: { fontSize: 11, padding: '5px 9px', borderRadius: 99, whiteSpace: 'nowrap' },
  price: { fontWeight: 900, fontSize: 18, marginTop: 10 },
  oldPrice: { fontSize: 12, color: '#94A3B8', textDecoration: 'line-through', marginTop: 4 },
  meta: { fontSize: 12, color: '#64748B', margin: '8px 0 4px' },
  variantMeta: { fontSize: 12, color: '#334155', marginTop: 4 },
  actions: { display: 'flex', gap: 8, marginTop: 12 },
  edit: { border: 0, borderRadius: 8, padding: '9px 14px', background: '#E2E8F0', cursor: 'pointer', flex: 1 },
  noProducts: { color: '#64748B', gridColumn: '1/-1' }
};
