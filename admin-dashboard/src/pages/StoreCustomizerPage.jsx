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

const DEFAULT_THEME = {
  accent: '#0F172A',
  accentSoft: '#F1F5F9',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  border: '#E5E7EB',
  radius: 18,
};

const DEFAULT_LAYOUT = HOME_SECTIONS.map(([id, title, desc, icon], order) => ({
  id, title, desc, icon, enabled: true, order,
}));

const normalizeLayout = (value) => {
  const source = Array.isArray(value) ? value : DEFAULT_LAYOUT;
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
  const [layouts, setLayouts] = useState({ home: DEFAULT_LAYOUT });
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [dragged, setDragged] = useState(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('layout');
  const [preview, setPreview] = useState('mobile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sections = layouts.home || DEFAULT_LAYOUT;
  const enabledCount = useMemo(() => sections.filter((item) => item.enabled).length, [sections]);

  useEffect(() => {
    let alive = true;
    api.get('/settings')
      .then(({ data }) => {
        if (!alive) return;
        const remoteLayouts = data?.settings?.pageLayouts;
        const remoteTheme = data?.settings?.theme;
        if (remoteLayouts && typeof remoteLayouts === 'object' && !Array.isArray(remoteLayouts)) {
          setLayouts({ home: normalizeLayout(remoteLayouts.home) });
        }
        setTheme(normalizeTheme(remoteTheme));
      })
      .catch(() => setError('تعذر تحميل إعدادات التخصيص المركزية.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const updateSections = (next) => setLayouts((current) => ({ ...current, home: normalizeLayout(next) }));

  const move = (from, to) => {
    if (from === to) return;
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
    pageLayouts: { ...layouts, home: normalizeLayout(sections) },
    theme: normalizeTheme(theme),
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const { data } = await api.put('/settings', payload);
      setLayouts({ home: normalizeLayout(data?.settings?.pageLayouts?.home || sections) });
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
    const nextLayouts = { ...layouts, home: DEFAULT_LAYOUT };
    const nextTheme = DEFAULT_THEME;
    setLayouts(nextLayouts);
    setTheme(nextTheme);
    setError('');
    try {
      const { data } = await api.put('/settings', { pageLayouts: nextLayouts, theme: nextTheme });
      setLayouts({ home: normalizeLayout(data?.settings?.pageLayouts?.home || DEFAULT_LAYOUT) });
      setTheme(normalizeTheme(data?.settings?.theme || nextTheme));
      localStorage.removeItem('mybrand_store_page_layouts');
      localStorage.removeItem('mybrand_store_theme');
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
          <p>{loading ? 'جارٍ تحميل التخصيص المركزي…' : 'تحكم فعلي في المظهر العام وترتيب وإخفاء أقسام الصفحة الرئيسية.'}</p>
        </div>
        <div className="customizer-actions">
          <button className="secondary-btn" onClick={reset} disabled={loading || saving}>إعادة ضبط</button>
          <button className="primary-btn" onClick={save} disabled={loading || saving}>
            {saving ? 'جارٍ الحفظ…' : saved ? '✓ تم الحفظ مركزيًا' : 'حفظ التخصيص'}
          </button>
        </div>
      </header>

      {error && <div className="customizer-error">{error}</div>}

      <section className="customizer-tabs">
        <button className={activeTab === 'layout' ? 'active' : ''} onClick={() => setActiveTab('layout')}>✦ ترتيب الصفحة الرئيسية</button>
        <button className={activeTab === 'theme' ? 'active' : ''} onClick={() => setActiveTab('theme')}>🎨 المظهر العام</button>
      </section>

      {activeTab === 'layout' ? (
        <div className="builder-layout">
          <section className="builder-panel">
            <div className="panel-title">
              <div><span>/</span><h2>🏠 الصفحة الرئيسية الفعلية</h2></div>
              <strong>{enabledCount} من {sections.length} مفعّل</strong>
            </div>
            <div className="section-list">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => setDragged(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragged !== null) move(dragged, index); setDragged(null); }}
                  onDragEnd={() => setDragged(null)}
                  className={`section-row ${!section.enabled ? 'disabled' : ''} ${dragged === index ? 'dragging' : ''}`}
                >
                  <span className="drag-handle">⠿</span>
                  <span className="section-number">{index + 1}</span>
                  <span className="section-icon">{section.icon}</span>
                  <div className="section-copy"><strong>{section.title}</strong><small>{section.desc}</small></div>
                  <button className={`switch ${section.enabled ? 'on' : ''}`} onClick={() => toggle(section.id)} aria-label={section.enabled ? 'إخفاء القسم' : 'إظهار القسم'}><span /></button>
                </div>
              ))}
            </div>
            <div className="tip"><span>✓</span><div><strong>تخصيص فعلي</strong><small>الترتيب والإخفاء يُطبّقان على الصفحة الرئيسية بعد الحفظ، وتصل الإعدادات من الخادم مباشرة.</small></div></div>
          </section>

          <section className="preview-panel">
            <div className="preview-head">
              <div><span>LIVE PREVIEW</span><h2>معاينة المتجر</h2></div>
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
