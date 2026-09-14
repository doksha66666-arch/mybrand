import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import ImageUploader from '../components/ImageUploader';
import VideoUploader from '../components/VideoUploader';
import './AddProductPage.css';

const empty = {
  nameAr: '', nameEn: '', slug: '', category: '', price: '', compareAtPrice: '', stock: '0', sku: '',
  descriptionAr: '', images: [], videoUrl: '', videoPoster: '', colors: [], sizes: [], tags: [],
  isActive: true, isFeatured: false, status: 'approved', seoTitle: '', seoDescription: '',
};

const makeSlug = (value) => String(value || '').trim().toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\u0600-\u06FF\w-]+/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

export default function AddProductPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const addTag = () => { const value = window.prompt('اكتب الوسم'); if (value?.trim()) set('tags', [...form.tags, value.trim()]); };
  const removeTag = value => set('tags', form.tags.filter(item => item !== value));
  const addColor = () => set('colors', [...form.colors, { name: '', image: '', stock: '0' }]);
  const updateColor = (index, key, value) => set('colors', form.colors.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const removeColor = index => set('colors', form.colors.filter((_, i) => i !== index));
  const addSize = () => set('sizes', [...form.sizes, { name: '', stock: '0', sku: '', priceModifier: '0' }]);
  const updateSize = (index, key, value) => set('sizes', form.sizes.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const removeSize = index => set('sizes', form.sizes.filter((_, i) => i !== index));

  const buildPayload = (status) => {
    const generatedSlug = form.slug.trim() || makeSlug(form.nameEn || form.nameAr);
    const nameEn = form.nameEn.trim() || form.nameAr.trim();
    const variants = [
      ...form.colors.filter(c => c.name.trim()).map(c => ({
        name: 'color', value: c.name.trim(), image: c.image || '', stock: Number(c.stock || 0), priceModifier: 0,
      })),
      ...form.sizes.filter(s => s.name.trim()).map(s => ({
        name: 'size', value: s.name.trim(), stock: Number(s.stock || 0), sku: s.sku || '', priceModifier: Number(s.priceModifier || 0),
      })),
    ];
    return {
      nameAr: form.nameAr.trim(), nameEn, slug: generatedSlug, category: form.category,
      descriptionAr: form.descriptionAr, price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      stock: Number(form.stock || 0), sku: form.sku.trim() || undefined,
      images: form.images, videoUrl: form.videoUrl || '', videoPoster: form.videoPoster || '', variants,
      tags: form.tags, seoTitle: form.seoTitle.trim() || undefined, seoDescription: form.seoDescription.trim() || undefined,
      isActive: status === 'approved' ? Boolean(form.isActive) : false,
      isFeatured: status === 'approved' ? Boolean(form.isFeatured) : false, status,
    };
  };

  const save = async (status) => {
    setError('');
    const nameAr = form.nameAr.trim();
    const nameEn = form.nameEn.trim() || nameAr;
    const slug = form.slug.trim() || makeSlug(nameEn || nameAr);
    if (!nameAr) return setError('اكتب اسم المنتج بالعربية.');
    if (!nameEn) return setError('اكتب اسم المنتج بالإنجليزية.');
    if (!slug) return setError('أدخل رابطًا مختصرًا صالحًا للمنتج.');
    if (!form.category) return setError('اختر قسم المنتج.');
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) return setError('أدخل سعرًا صالحًا.');
    if (form.colors.some(c => c.name.trim() && !c.image)) return setError('كل لون مضاف يجب أن تكون له صورة.');

    const draft = status === 'draft';
    draft ? setDraftSaving(true) : setSaving(true);
    try {
      await api.post('/products', buildPayload(status));
      navigate('/products');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حفظ المنتج. راجع البيانات وحاول مرة أخرى.');
    } finally {
      draft ? setDraftSaving(false) : setSaving(false);
    }
  };

  const previewPrice = useMemo(() => Number(form.price || 0).toLocaleString('ar-EG'), [form.price]);
  return <div className="add-product" dir="rtl">
    <div className="ap-head"><div><div className="ap-crumb">المنتجات <b>← إضافة منتج جديد</b></div><h1>إضافة منتج جديد</h1><p>املأ بيانات المنتج بالكامل عشان يظهر بشكل احترافي في المتجر</p></div><button type="button" className="ap-preview-btn" onClick={() => navigate('/products')}>معاينة</button></div>
    {error && <div className="ap-error">{error}</div>}
    <form onSubmit={e => { e.preventDefault(); save(form.isActive ? 'approved' : 'hidden'); }}><div className="ap-grid"><main>
      <section className="ap-card"><h2>المعلومات الأساسية</h2>
        <div className="ap-two"><Field label="اسم المنتج بالعربية" required><input required value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="مثال: فستان صيفي بأكمام قصيرة" /></Field><Field label="اسم المنتج بالإنجليزية" required><input required value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="Example: Summer Dress" /></Field></div>
        <Field label="الرابط المختصر"><input value={form.slug} onChange={e => set('slug', makeSlug(e.target.value))} placeholder="summer-dress" /><small>سيتم توليده تلقائيًا من اسم المنتج عند تركه فارغًا.</small></Field>
        <Field label="الوصف"><textarea value={form.descriptionAr} onChange={e => set('descriptionAr', e.target.value)} placeholder="اكتب وصف تفصيلي للمنتج..." /></Field>
        <div className="ap-two"><Field label="القسم" required><select required value={form.category} onChange={e => set('category', e.target.value)}><option value="">اختر القسم</option>{categories.map(c => <option key={c._id} value={c._id}>{c.nameAr}</option>)}</select></Field></div>
      </section>
      <section className="ap-card"><h2>الوسائط</h2><div className="ap-upload"><ImageUploader images={form.images} onChange={v => set('images', v)} /></div><VideoUploader value={form.videoUrl} onChange={v => set('videoUrl', v)} /></section>
      <section className="ap-card"><h2>السعر والمخزون</h2><div className="ap-three"><Field label="السعر الأصلي"><input type="number" min="0" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} placeholder="250" /></Field><Field label="سعر البيع" required><input required type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="99" /></Field><Field label="الكمية المتاحة" required><input required type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="120" /></Field></div><Field label="رمز المنتج SKU"><input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="MB-DR-1029" /></Field></section>
      <section className="ap-card"><div className="variant-head"><div><h2>الألوان والمقاسات</h2><p>كل لون له صورة ومخزون خاص به، وكل مقاس له مخزون وSKU وتعديل سعر اختياري.</p></div></div>
        <div className="variant-block"><div className="variant-title"><b>ألوان المنتج</b><button type="button" className="add-chip" onClick={addColor}>+ إضافة لون</button></div>{form.colors.map((color, i) => <div className="color-variant" key={i}><div className="color-fields"><Field label="اسم اللون"><input value={color.name} onChange={e => updateColor(i, 'name', e.target.value)} placeholder="مثال: أسود" /></Field><Field label="مخزون اللون"><input type="number" min="0" value={color.stock} onChange={e => updateColor(i, 'stock', e.target.value)} /></Field><div className="color-image"><span>صورة اللون <em>*</em></span><ImageUploader images={color.image ? [color.image] : []} onChange={v => updateColor(i, 'image', v[0] || '')} /></div></div><button type="button" className="remove-variant" onClick={() => removeColor(i)}>حذف اللون</button></div>)}{!form.colors.length && <div className="variant-empty">أضف كل لون متاح للمنتج وحدد مخزونه وارفع صورة واضحة خاصة بهذا اللون.</div>}</div>
        <div className="variant-block"><div className="variant-title"><b>مقاسات المنتج</b><button type="button" className="add-chip" onClick={addSize}>+ إضافة مقاس</button></div>{form.sizes.map((size, i) => <div className="size-variant" key={i}><Field label="المقاس"><input value={size.name} onChange={e => updateSize(i, 'name', e.target.value)} placeholder="S / M / L / XL أو 36 / 38..." /></Field><Field label="المخزون"><input type="number" min="0" value={size.stock} onChange={e => updateSize(i, 'stock', e.target.value)} /></Field><Field label="SKU"><input value={size.sku} onChange={e => updateSize(i, 'sku', e.target.value)} placeholder="MB-S-M" /></Field><Field label="تعديل السعر"><input type="number" step="0.01" value={size.priceModifier} onChange={e => updateSize(i, 'priceModifier', e.target.value)} placeholder="0" /></Field><button type="button" className="remove-variant" onClick={() => removeSize(i)}>×</button></div>)}{!form.sizes.length && <div className="variant-empty">أضف المقاسات المتاحة. يمكنك تحديد مخزون وSKU وتعديل سعر لكل مقاس.</div>}</div>
      </section>
      <section className="ap-card"><h2>تحسين محركات البحث (SEO)</h2><Field label="عنوان الصفحة"><input value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)} placeholder="فستان صيفي بأكمام قصيرة | MYBRAND" /></Field><Field label="وصف ميتا"><textarea value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} placeholder="فستان صيفي عصري بخامة قطنية ناعمة..." /></Field><div className="seo-preview"><div className="url">mybrand.com › products › {form.slug || 'summer-dress'}</div><div className="title">{form.seoTitle || 'فستان صيفي بأكمام قصيرة | MYBRAND'}</div><div className="desc">{form.seoDescription || 'فستان صيفي عصري بخامة قطنية ناعمة، متوفر بعدة ألوان ومقاسات...'}</div></div></section>
    </main><aside>
      <section className="ap-card"><h2>حالة النشر</h2><Toggle label="نشر المنتج" hint="يظهر فورًا في المتجر" value={form.isActive} onChange={() => set('isActive', !form.isActive)} /><Toggle label="منتج مميز" hint="يظهر في الأقسام المميزة" value={form.isFeatured} onChange={() => set('isFeatured', !form.isFeatured)} /></section>
      <section className="ap-card"><h2>وسوم البحث</h2><div className="chip-input">{form.tags.map(v => <span className="chip" key={v}>{v}<button type="button" onClick={() => removeTag(v)}>×</button></span>)}<button type="button" className="add-chip" onClick={addTag}>+ إضافة وسم</button></div><div className="price-preview">السعر: <b>{previewPrice} ج</b></div></section>
    </aside></div><div className="sticky-actions"><button type="button" className="ap-draft" disabled={draftSaving || saving} onClick={() => save('draft')}>{draftSaving ? 'جارٍ الحفظ...' : 'حفظ كمسودة'}</button><button type="submit" className="ap-primary" disabled={saving || draftSaving}><span>✓</span>{saving ? 'جارٍ النشر...' : 'نشر المنتج'}</button></div></form>
  </div>;
}
function Field({ label, required, children }) { return <label className="ap-field"><span>{label}{required && <em>*</em>}</span>{children}</label>; }
function Toggle({ label, hint, value, onChange }) { return <div className="toggle-row"><div><b>{label}</b><span>{hint}</span></div><button type="button" className={'switch ' + (value ? 'on' : '')} onClick={onChange} aria-label={label} /></div>; }
