import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import ImageUploader from '../components/ImageUploader';
import './CategoriesPage.css';

const ICONS = ['◈','◇','✦','◆','✚','⬢','●','■','★','✿','⌂','♢'];
const emptyForm = { nameAr: '', nameEn: '', slug: '', image: '', icon: '◈', parentCategory: '', isActive: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [reorderDirty, setReorderDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories/admin/all');
      setCategories(data.categories || []);
      setReorderDirty(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل الأقسام');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => `${c.nameAr} ${c.nameEn} ${c.slug}`.toLowerCase().includes(q));
  }, [categories, search]);

  const parentName = (id) => categories.find((c) => c._id === id)?.nameAr || 'قسم رئيسي';
  const resetForm = () => { setEditingId(null); setForm(emptyForm); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, parentCategory: form.parentCategory || null };
      if (editingId) await api.put(`/categories/${editingId}`, payload);
      else await api.post('/categories', payload);
      resetForm(); await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حفظ القسم');
    } finally { setSaving(false); }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setForm({
      nameAr: category.nameAr || '', nameEn: category.nameEn || '', slug: category.slug || '',
      image: category.image || '', icon: category.icon || '◈', parentCategory: category.parentCategory?._id || category.parentCategory || '',
      isActive: category.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (category) => {
    try {
      const { data } = await api.put(`/categories/${category._id}`, { isActive: !category.isActive });
      setCategories((items) => items.map((c) => c._id === category._id ? data.category : c));
    } catch (err) { setError(err?.response?.data?.message || 'تعذر تغيير حالة القسم'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا القسم نهائيًا؟')) return;
    try { await api.delete(`/categories/${id}`); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'تعذر حذف القسم'); }
  };

  const moveCategory = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setCategories((items) => {
      const next = [...items];
      const from = next.findIndex((c) => c._id === fromId);
      const to = next.findIndex((c) => c._id === toId);
      if (from < 0 || to < 0) return items;
      const [item] = next.splice(from, 1); next.splice(to, 0, item);
      return next.map((c, index) => ({ ...c, sortOrder: index }));
    });
    setReorderDirty(true);
  };

  const saveOrder = async () => {
    setSaving(true); setError('');
    try {
      const { data } = await api.put('/categories/admin/reorder', { items: categories.map((c) => ({ id: c._id })) });
      setCategories(data.categories || categories); setReorderDirty(false);
    } catch (err) { setError(err?.response?.data?.message || 'تعذر حفظ ترتيب الأقسام'); }
    finally { setSaving(false); }
  };

  const activeCount = categories.filter((c) => c.isActive !== false).length;
  const parentCount = categories.filter((c) => !c.parentCategory).length;
  const childCount = categories.length - parentCount;

  return (
    <div className="categories-page" dir="rtl">
      <div className="categories-head">
        <div><h1>إضافة وإدارة الأقسام</h1><p>نظّم أقسام MYBRAND، حدّد الأقسام الرئيسية والفرعية ورتّب ظهورها للعميل.</p></div>
        <div className="category-actions"><button className="cat-btn primary" onClick={resetForm}>＋ قسم جديد</button></div>
      </div>

      <div className="cat-kpis">
        <div className="cat-kpi"><div className="num">{categories.length}</div><div className="label">إجمالي الأقسام</div></div>
        <div className="cat-kpi"><div className="num">{activeCount}</div><div className="label">أقسام مفعّلة</div></div>
        <div className="cat-kpi"><div className="num">{parentCount}</div><div className="label">أقسام رئيسية</div></div>
        <div className="cat-kpi"><div className="num">{childCount}</div><div className="label">أقسام فرعية</div></div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="cat-layout">
        <form className="cat-panel" onSubmit={handleSubmit}>
          <h3>{editingId ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
          <div className="field"><label>اسم القسم بالعربي</label><input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="مثال: ملابس نسائية" required /></div>
          <div className="field"><label>اسم القسم بالإنجليزي</label><input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Women's Fashion" required /></div>
          <div className="field"><label>Slug</label><input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="womens-fashion" required /><div className="help">يُستخدم في رابط القسم داخل المتجر.</div></div>
          <div className="two">
            <div className="field"><label>القسم الرئيسي</label><select value={form.parentCategory} onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}><option value="">قسم رئيسي</option>{categories.filter((c) => c._id !== editingId).map((c) => <option key={c._id} value={c._id}>{c.nameAr}</option>)}</select></div>
            <div className="field"><label>الحالة</label><select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}><option value="active">مفعّل</option><option value="inactive">متوقف</option></select></div>
          </div>
          <div className="field"><label>أيقونة القسم</label><div className="icon-grid">{ICONS.map((icon) => <button type="button" key={icon} className={`icon-option ${form.icon === icon ? 'selected' : ''}`} onClick={() => setForm({ ...form, icon })}>{icon}</button>)}</div></div>
          <div className="field"><label>صورة القسم <span>(اختياري)</span></label><div className="image-box">{form.image ? <img src={form.image} alt="معاينة القسم" /> : 'ارفع صورة للقسم أو اتركها بدون صورة'}</div><ImageUploader images={form.image ? [form.image] : []} onChange={(images) => setForm({ ...form, image: images[0] || '' })} /></div>
          <div className="form-actions"><button className="cat-btn primary" type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة القسم'}</button>{editingId && <button className="cat-btn ghost" type="button" onClick={resetForm}>إلغاء</button>}</div>
        </form>

        <section>
          <div className="section-toolbar"><h2>الأقسام الحالية</h2><input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الأقسام..." /></div>
          {reorderDirty && <div className="sticky-save"><span className="help">تم تغيير الترتيب — احفظه ليظهر بنفس الشكل في المتجر.</span><button className="cat-btn primary" onClick={saveOrder} disabled={saving}>حفظ الترتيب</button></div>}
          {loading ? <div className="empty-state">جارٍ تحميل الأقسام...</div> : filtered.length === 0 ? <div className="empty-state">لا توجد أقسام مطابقة للبحث.</div> : <div className="category-list">
            {filtered.map((category) => (
              <article key={category._id} className={`category-row ${dragId === category._id ? 'dragging' : ''} ${dragOverId === category._id ? 'drag-over' : ''}`} draggable onDragStart={() => setDragId(category._id)} onDragOver={(e) => { e.preventDefault(); setDragOverId(category._id); }} onDrop={(e) => { e.preventDefault(); moveCategory(dragId, category._id); setDragId(null); setDragOverId(null); }} onDragEnd={() => { setDragId(null); setDragOverId(null); }}>
                <div className="drag-handle" title="اسحب لإعادة الترتيب">⠿</div>
                <div className="cat-info"><div className="cat-icon">{category.icon || '◈'}</div><div><strong>{category.nameAr}</strong><span>{category.nameEn} · {category.slug}</span></div></div>
                <div className="cat-parent">{category.parentCategory ? <>فرعي من<br /><b>{parentName(category.parentCategory?._id || category.parentCategory)}</b></> : 'قسم رئيسي'}</div>
                <div className="cat-order">الترتيب<b>{Number(category.sortOrder || 0) + 1}</b></div>
                <div className="cat-status"><span className={`status-chip ${category.isActive !== false ? 'on' : 'off'}`}>{category.isActive !== false ? 'مفعّل' : 'متوقف'}</span><div className="row-actions"><button className="icon-btn" title="تعديل" onClick={() => handleEdit(category)}>✎</button><button className="icon-btn" title={category.isActive !== false ? 'إيقاف' : 'تفعيل'} onClick={() => handleToggle(category)}>{category.isActive !== false ? '◉' : '○'}</button><button className="icon-btn" title="حذف" onClick={() => handleDelete(category._id)}>⌫</button></div></div>
              </article>
            ))}
          </div>}
        </section>
      </div>
    </div>
  );
}
