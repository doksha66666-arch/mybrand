import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './StoreCustomizerPage.css';

const HOME_SECTIONS = [
  ['hero', 'العرض الرئيسي', 'منطقة العرض المباشر أو البانر الرئيسي', '🖼️'],
  ['offers', 'العروض', 'الشريط والعروض السريعة', '🔥'],
  ['categories', 'الأقسام', 'أقسام المتجر والصور', '🏷️'],
  ['best', 'الأكثر مبيعًا', 'مجموعة المنتجات الرئيسية', '🏆'],
  ['featured', 'العروض المميزة', 'المنتجات التي عليها خصم', '⭐'],
  ['new', 'وصل حديثًا', 'أحدث المنتجات المنشورة', '🆕'],
  ['why', 'لماذا MYBRAND', 'مزايا الثقة والخدمة', '💎'],
  ['services', 'خدمات المتجر', 'الشحن والإرجاع والدفع', '🚚'],
];

const PAGE_DEFS = [
  { id: 'home', title: 'الرئيسية', icon: '🏠', movable: true, sections: [
    ['hero','العرض الرئيسي','منطقة العرض المباشر أو البانر الرئيسي','🖼️'],['offers','العروض','الشريط والعروض السريعة','🔥'],['categories','الأقسام','أقسام المتجر والصور','🏷️'],['best','الأكثر مبيعًا','مجموعة المنتجات الرئيسية','🏆'],['featured','العروض المميزة','المنتجات التي عليها خصم','⭐'],['new','وصل حديثًا','أحدث المنتجات المنشورة','🆕'],['why','لماذا MYBRAND','مزايا الثقة والخدمة','💎'],['services','خدمات المتجر','الشحن والإرجاع والدفع','🚚']
  ]},
  { id: 'categories', title: 'الأقسام', icon: '🏷️', movable: false, sections: [
    ['header','رأس صفحة الأقسام','الشعار والبحث','🧭'],['rail','شريط الأقسام','قائمة الأقسام الجانبية','🗂️'],['products','منتجات القسم','المنتجات والتصنيفات الفرعية','🛍️'],['bottomNav','التنقل السفلي','التنقل الرئيسي','📱']
  ]},
  { id: 'product', title: 'تفاصيل المنتج', icon: '🛍️', movable: false, sections: [
    ['topbar','الشريط العلوي','العودة والبحث والسلة','↩️'],['gallery','صور المنتج','المعرض والصور المصغرة','🖼️'],['info','معلومات المنتج','العنوان والسعر والتقييم','ℹ️'],['seller','البائع','بيانات وتصنيف البائع','🏪'],['delivery','التوصيل والمخزون','التوفر والشحن','🚚'],['variants','اختيارات المنتج','الألوان والمقاسات','🎨'],['details','التفاصيل والشحن','الوصف والشحن والإرجاع','📋'],['reviews','التقييمات','ملخص تقييمات المنتج','⭐'],['actions','أزرار الشراء','المفضلة والسلة والشراء الآن','🛒']
  ]},
  { id: 'cart', title: 'السلة', icon: '🛒', movable: false, sections: [
    ['header','رأس السلة','العنوان والعودة والتسوق','🧭'],['items','المنتجات','العناصر والكميات والمخزون','🛍️'],['checkoutBar','إتمام الشراء','الإجمالي وزر المتابعة','💳']
  ]},
  { id: 'checkout', title: 'إتمام الطلب', icon: '💳', movable: false, sections: [
    ['header','رأس الدفع','العودة والعنوان','🧭'],['steps','مراحل الطلب','السلة والدفع والتأكيد','1️⃣'],['customer','بيانات العميل','الاسم والهاتف','👤'],['address','العنوان والشحن','العنوان وخيارات الشحن','📍'],['products','المنتجات','محتويات الطلب','🛍️'],['coupon','كود الخصم','الكوبونات والخصم','🎟️'],['payment','الدفع','طرق الدفع والمعلومات','💳'],['summary','ملخص الطلب','الخصم والشحن والإجمالي','🧾'],['actions','تأكيد الطلب','الزر النهائي وملاحظة الأمان','✅']
  ]},
  { id: 'account', title: 'الحساب', icon: '👤', movable: false, sections: [
    ['profile','الملف الشخصي','بيانات الحساب والاسم','👤'],['stats','ملخص الحساب','الطلبات والنقاط والمفضلة','📊'],['menu','قائمة الحساب','الأقسام والروابط','🧭'],['chat','خدمة العملاء','محادثة خدمة العملاء','🎧'],['logout','تسجيل الخروج','خروج الحساب','↪️']
  ]},
  { id: 'orders', title: 'الطلبات', icon: '📦', movable: false, sections: [
    ['hero','رأس الطلبات','عنوان صفحة الطلبات','📦'],['stats','إحصاءات الطلبات','ملخص الحالات','📊'],['toolbar','أدوات التصفية','فلترة الطلبات','⚙️'],['list','سجل الطلبات','بطاقات الطلبات والتتبع','🧾']
  ]},
  { id: 'wishlist', title: 'المفضلة', icon: '❤️', movable: false, sections: [
    ['topbar','الشريط العلوي','العودة ومسح المفضلة','↩️'],['tabs','تبويبات المفضلة','المنتجات ومتابعة التسوق','🧭'],['products','المنتجات المحفوظة','شبكة المنتجات','❤️'],['bottomNav','التنقل السفلي','التنقل الرئيسي','📱']
  ]},
];

const DEFAULT_THEME = {
  accent: '#0F172A',
  accentSoft: '#F1F5F9',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  border: '#E5E7EB',
  radius: 18,
};

const DEFAULT_LAYOUT = HOME_SECTIONS.map(([id, title, desc, icon], order) => ({ id, title, desc, icon, enabled: true, order }));
const makeDefault = (page) => page.sections.map(([id, title, desc, icon], order) => ({ id, title, desc, icon, enabled: true, order }));

const normalizeLayout = (page, value) => {
  const source = Array.isArray(value) ? value : makeDefault(page);
  return source.map((item, index) => ({
    ...item,
    order: index,
    enabled: item?.enabled !== false,
  }));
};

const normalizeTheme = (value) => ({
  ...DEFAULT_THEME,
  ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
});

const THEME_CONTROLS = [
  ['accent', 'لون الهوية', 'الأزرار، الشعار والعناصر النشطة'],
  ['accentSoft', 'لون التمييز الخفيف', 'الخلفيات الخفيفة والتنبيهات'],
  ['background', 'خلفية المتجر', 'الخلفية العامة للصفحات'],
  ['surface', 'خلفية البطاقات', 'البطاقات والنوافذ'],
  ['text', 'لون النص', 'النص الأساسي'],
  ['border', 'لون الحدود', 'الفواصل وحدود البطاقات'],
];

export default function StoreCustomizerPage() {
  const [pageId, setPageId] = useState('home');
  const [layouts, setLayouts] = useState(() => Object.fromEntries(PAGE_DEFS.map((item) => [item.id, makeDefault(item)])));
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [dragged, setDragged] = useState(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('layout');
  const [preview, setPreview] = useState('mobile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const page = PAGE_DEFS.find((item) => item.id === pageId) || PAGE_DEFS[0];
  const sections = layouts[pageId] || makeDefault(page);
  const enabledCount = useMemo(() => sections.filter((item) => item.enabled).length, [sections]);

  useEffect(() => {
    let alive = true;
    api.get('/settings')
      .then(({ data }) => {
        if (!alive) return;
        const remoteLayouts = data?.settings?.pageLayouts;
        const remoteTheme = data?.settings?.theme;
        if (remoteLayouts && typeof remoteLayouts === 'object' && !Array.isArray(remoteLayouts)) {
          const next = Object.fromEntries(PAGE_DEFS.map((item) => [item.id, normalizeLayout(item, remoteLayouts[item.id])]));
          setLayouts(next);
        }
        setTheme(normalizeTheme(remoteTheme));
      })
      .catch(() => setError('تعذر تحميل إعدادات التخصيص المركزية.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const updateSections = (next) => setLayouts((current) => ({ ...current, [pageId]: normalizeLayout(page, next) }));

  const move = (from, to) => {
    if (from === to) return;
    if (!page.movable) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateSections(next);
  };

  const toggle = (id) => updateSections(
    sections.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item)
  );

  const setThemeValue = (key, value) => setTheme((current) => ({ ...current, [key]: value }));

  const payload = {
    pageLayouts: { ...layouts, [pageId]: normalizeLayout(page, sections) },
    theme: normalizeTheme(theme),
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const { data } = await api.put('/settings', payload);
      setLayouts((current) => ({ ...current, [pageId]: normalizeLayout(page, data?.settings?.pageLayouts?.[pageId] || sections) }));
      setTheme(normalizeTheme(data?.settings?.theme || theme));
      localStorage.setItem('mybrand_store_page_layouts', JSON.stringify(data?.settings?.pageLayouts || payload.pageLayouts));
      localStorage.setItem('mybrand_store_theme', JSON.stringify(data?.settings?.theme || theme));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حفظ التخصيص المركزي.');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('إرجاع تخصيص الصفحة الرئيسية والمظهر العام للوضع الافتراضي؟')) return;
    const nextLayouts = { ...layouts, [pageId]: makeDefault(page) };
    const nextTheme = DEFAULT_THEME;
    setLayouts(nextLayouts);
    setTheme(nextTheme);
    setError('');
    try {
      const { data } = await api.put('/settings', { pageLayouts: nextLayouts });
      setLayouts((current) => ({ ...current, [pageId]: normalizeLayout(page, data?.settings?.pageLayouts?.[pageId] || makeDefault(page)) }));
      localStorage.setItem('mybrand_store_page_layouts', JSON.stringify(data?.settings?.pageLayouts || nextLayouts));
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إعادة الضبط مركزيًا.');
    }
  };

  const previewStyle = {
    '--preview-accent': theme.accent,
    '--preview-accent-soft': theme.accentSoft,
    '--preview-bg': theme.background,
    '--preview-surface': theme.surface,
    '--preview-text': theme.text,
    '--preview-border': theme.border,
    '--preview-radius': `${Number(theme.radius) || DEFAULT_THEME.radius}px`,
  };

  return (
    <div className="store-customizer" dir="rtl">
      <header className="customizer-head">
        <div>
          <span className="customizer-kicker">MYBRAND STORE BUILDER</span>
          <h1>تخصيص المتجر</h1>
          <p>{loading ? 'جارٍ تحميل التخصيص المركزي…' : 'تحكم فعلي في مظهر المتجر وإظهار أو إخفاء أقسام الصفحات المرتبطة.'}</p>
        </div>
        <div className="customizer-actions">
          <button className="secondary-btn" onClick={reset} disabled={loading || saving}>إعادة ضبط</button>
          <button className="primary-btn" onClick={save} disabled={loading || saving}>
            {saving ? 'جارٍ الحفظ…' : saved ? '✓ تم الحفظ مركزيًا' : 'حفظ التخصيص'}
          </button>
        </div>
      </header>

      {error && <div className="customizer-error">{error}</div>}

      {activeTab === 'layout' && <section className="page-selector"><div className="page-selector-title"><span>STORE PAGES</span><strong>{PAGE_DEFS.length} صفحات مرتبطة فعليًا</strong></div><div className="page-tabs">{PAGE_DEFS.map((item) => <button key={item.id} className={item.id === pageId ? 'active' : ''} onClick={() => { setPageId(item.id); setDragged(null); }}>{item.icon}<span>{item.title}</span></button>)}</div></section>}

      <section className="customizer-tabs">
        <button className={activeTab === 'layout' ? 'active' : ''} onClick={() => setActiveTab('layout')}>✦ تخطيط الصفحات</button>
        <button className={activeTab === 'theme' ? 'active' : ''} onClick={() => setActiveTab('theme')}>🎨 المظهر العام</button>
      </section>

      {activeTab === 'layout' ? (
        <div className="builder-layout">
          <section className="builder-panel">
            <div className="panel-title">
              <div><span>{page.movable ? 'قابل لإعادة الترتيب' : 'تحكم في الظهور'}</span><h2>{page.icon} {page.title}</h2></div>
              <strong>{enabledCount} من {sections.length} مفعّل</strong>
            </div>
            <div className="section-list">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable={page.movable}
                  onDragStart={() => page.movable && setDragged(index)}
                  onDragOver={(e) => page.movable && e.preventDefault()}
                  onDrop={() => { if (page.movable && dragged !== null) move(dragged, index); setDragged(null); }}
                  onDragEnd={() => setDragged(null)}
                  className={`section-row ${!section.enabled ? 'disabled' : ''} ${dragged === index ? 'dragging' : ''} ${!page.movable ? 'locked' : ''}`}
                >
                  <span className="drag-handle">{page.movable ? '⠿' : '•'}</span>
                  <span className="section-number">{index + 1}</span>
                  <span className="section-icon">{section.icon}</span>
                  <div className="section-copy"><strong>{section.title}</strong><small>{section.desc}</small></div>
                  <button className={`switch ${section.enabled ? 'on' : ''}`} onClick={() => toggle(section.id)} aria-label={section.enabled ? 'إخفاء القسم' : 'إظهار القسم'}><span /></button>
                </div>
              ))}
            </div>
            <div className="tip"><span>✓</span><div><strong>{page.movable ? 'الترتيب والإخفاء فعّالان' : 'الإظهار والإخفاء فعّالان'}</strong><small>{page.movable ? 'اسحب الأقسام لتغيير ترتيب الصفحة الرئيسية.' : 'تم ربط هذه العناصر بواجهة المتجر الحقيقية؛ الإخفاء يُطبق بعد الحفظ.'}</small></div></div>
          </section>

          <section className="preview-panel">
            <div className="preview-head">
              <div><span>LIVE PREVIEW</span><h2>معاينة {page.title}</h2></div>
              <div className="preview-switch"><button className={preview === 'mobile' ? 'active' : ''} onClick={() => setPreview('mobile')}>📱</button><button className={preview === 'desktop' ? 'active' : ''} onClick={() => setPreview('desktop')}>🖥️</button></div>
            </div>
            <div className={`store-preview ${preview}`} style={previewStyle}>
              <div className="fake-header"><b>MYBRAND</b><span>⌕　♡　🛒</span></div>
              {sections.filter((item) => item.enabled).map((section) => (
                <div key={section.id} className={`fake-section fake-${section.id}`}>
                  <span>{section.icon}</span><strong>{section.title}</strong><small>{section.desc}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="theme-panel">
          <div className="theme-grid">
            <div className="theme-card theme-editor">
              <div className="panel-title"><div><span>GLOBAL THEME</span><h2>🎨 هوية المتجر</h2></div></div>
              <div className="theme-controls">
                {THEME_CONTROLS.map(([key, title, hint]) => (
                  <label key={key} className="theme-control">
                    <div><strong>{title}</strong><small>{hint}</small></div>
                    <span className="color-field"><input type="color" value={theme[key]} onChange={(e) => setThemeValue(key, e.target.value)} /><code>{theme[key]}</code></span>
                  </label>
                ))}
                <label className="theme-control radius-control">
                  <div><strong>استدارة البطاقات</strong><small>من الشكل الحاد إلى الناعم</small></div>
                  <span><input type="range" min="8" max="32" value={Number(theme.radius) || 18} onChange={(e) => setThemeValue('radius', Number(e.target.value))} /><b>{Number(theme.radius) || 18}px</b></span>
                </label>
              </div>
            </div>
            <div className="theme-card theme-preview" style={previewStyle}>
              <div className="mini-site">
                <div className="mini-header"><b>MYBRAND</b><span>سلة　حسابي</span></div>
                <div className="mini-hero"><span>MYBRAND STORE</span><strong>تسوق بثقة وجودة عالية</strong><button>تسوق الآن</button></div>
                <div className="mini-cards"><div/><div/><div/></div>
                <div className="mini-banner"><b>عروض اليوم</b><span>اكتشف أحدث المنتجات</span></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="customizer-links">
        <Link to="/banners">إدارة البنرات ←</Link>
        <Link to="/settings">إعدادات المتجر ←</Link>
      </div>
    </div>
  );
}
