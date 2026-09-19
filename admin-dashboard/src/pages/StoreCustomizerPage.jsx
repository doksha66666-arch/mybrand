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
  buttonRadius: 12,
  contentWidth: 1200,
  fontScale: 1,
  shadow: 1,
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

const RANGE_CONTROLS = [
  ['radius', 'استدارة البطاقات', 'استدارة البطاقات والصناديق', 8, 32, 1, 'px'],
  ['buttonRadius', 'استدارة الأزرار', 'شكل أزرار الشراء والإجراءات', 6, 24, 1, 'px'],
  ['contentWidth', 'عرض المحتوى', 'أقصى عرض للمحتوى على الشاشات الكبيرة', 980, 1500, 10, 'px'],
  ['fontScale', 'حجم النص', 'تحكم بسيط في كثافة النصوص', 0.9, 1.1, 0.05, 'x'],
  ['shadow', 'شدة الظلال', 'من دون ظل إلى ظل واضح', 0, 3, 1, ''],
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
  const [previewProductId, setPreviewProductId] = useState('');
  const previewFrameRef = React.useRef(null);

  const page = PAGE_DEFS.find((item) => item.id === pageId) || PAGE_DEFS[0];
  const sections = layouts[pageId] || makeDefault(page);
  const enabledCount = useMemo(() => sections.filter((item) => item.enabled).length, [sections]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/settings'), api.get('/products', { params: { limit: 1, page: 1 } }).catch(() => ({ data: {} }))])
      .then(([settingsResponse, productsResponse]) => {
        const data = settingsResponse?.data || {};
        const sampleProducts = Array.isArray(productsResponse?.data?.products) ? productsResponse.data.products : [];
        const sample = sampleProducts[0];
        if (sample) setPreviewProductId(sample.slug || sample._id || sample.id || '');
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
    if (!window.confirm(`إرجاع تخطيط صفحة ${page.title} للوضع الافتراضي؟`)) return;
    const nextLayouts = { ...layouts, [pageId]: makeDefault(page) };
    setLayouts(nextLayouts);
    setError('');
    try {
      const { data } = await api.put('/settings', { pageLayouts: nextLayouts });
      setLayouts((current) => ({ ...current, [pageId]: normalizeLayout(page, data?.settings?.pageLayouts?.[pageId] || makeDefault(page)) }));
      localStorage.setItem('mybrand_store_page_layouts', JSON.stringify(data?.settings?.pageLayouts || nextLayouts));
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إعادة الضبط مركزيًا.');
    }
  };

  const storePreviewBase = String(import.meta.env.VITE_STORE_PUBLIC_URL || 'https://enchanting-miracle-production-a5d2.up.railway.app').replace(/\\/+$/, '');
  const previewPaths = {
    home: '/',
    categories: '/categories',
    product: previewProductId ? `/products/${encodeURIComponent(String(previewProductId))}` : '/categories',
    cart: '/cart',
    checkout: '/checkout',
    account: '/account',
    orders: '/orders',
    wishlist: '/wishlist',
  };
  const previewUrl = `${storePreviewBase}${previewPaths[pageId] || '/'}${previewPaths[pageId] === '/' ? '?customizerPreview=1' : '?customizerPreview=1'}`;

  const postPreviewState = React.useCallback(() => {
    const frame = previewFrameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage({
      type: 'MYBRAND_STORE_CUSTOMIZER_PREVIEW',
      pageLayouts: layouts,
      theme: normalizeTheme(theme),
    }, new URL(storePreviewBase).origin);
  }, [layouts, theme, storePreviewBase]);

  useEffect(() => {
    postPreviewState();
  }, [postPreviewState, pageId, previewProductId]);

  const livePreview = (
    <div className={`live-store-preview ${preview}`}>
      <div className="live-store-preview-toolbar">
        <span>المعاينة من المتجر الحقيقي — التعديلات غير المحفوظة تظهر هنا فورًا</span>
        {previewProductId ? <small>المنتج التجريبي: {String(previewProductId)}</small> : <small>أضف منتجًا لرؤية تفاصيل المنتج</small>}
      </div>
      <iframe
        key={previewUrl}
        ref={previewFrameRef}
        title={`معاينة ${page.title}`}
        src={previewUrl}
        className="live-store-preview-frame"
        onLoad={postPreviewState}
      />
    </div>
  );

  const previewStyle = {
    '--preview-accent': theme.accent,
    '--preview-accent-soft': theme.accentSoft,
    '--preview-bg': theme.background,
    '--preview-surface': theme.surface,
    '--preview-text': theme.text,
    '--preview-border': theme.border,
    '--preview-radius': `${Number(theme.radius) || DEFAULT_THEME.radius}px`,
    '--preview-button-radius': `${Number(theme.buttonRadius) || DEFAULT_THEME.buttonRadius}px`,
    '--preview-width': `${Number(theme.contentWidth) || DEFAULT_THEME.contentWidth}px`,
    '--preview-font-scale': Number(theme.fontScale) || DEFAULT_THEME.fontScale,
    '--preview-shadow': ['none','0 8px 25px rgba(15,23,42,.07)','0 14px 35px rgba(15,23,42,.11)','0 20px 50px rgba(15,23,42,.15)'][Math.min(3, Math.max(0, Number(theme.shadow)||0))],
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
            {livePreview}
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
                {RANGE_CONTROLS.map(([key, title, hint, min, max, step, suffix]) => (
                  <label key={key} className="theme-control radius-control">
                    <div><strong>{title}</strong><small>{hint}</small></div>
                    <span><input type="range" min={min} max={max} step={step} value={Number(theme[key])} onChange={(e) => setThemeValue(key, Number(e.target.value))} /><b>{Number(theme[key])}{suffix}</b></span>
                  </label>
                ))}
                <button type="button" className="theme-reset-btn" onClick={() => setTheme(DEFAULT_THEME)}>إرجاع المظهر الافتراضي</button>
              </div>
            </div>
            <div className="theme-card theme-preview" style={previewStyle}>{livePreview}</div>
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
