import React, { useEffect, useMemo, useState } from 'react';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import api from '../api/client';

const DEFAULT_SECTIONS = [
  { id: 'hero', title: 'العرض الرئيسي', desc: 'واجهة المتجر والعرض الأساسي', icon: '🖼️', enabled: true, order: 0 },
  { id: 'offers', title: 'العروض', desc: 'العروض والخصومات الحالية', icon: '🔥', enabled: true, order: 1 },
  { id: 'categories', title: 'الأقسام', desc: 'أقسام منتجات متجرك', icon: '🏷️', enabled: true, order: 2 },
  { id: 'best', title: 'الأكثر مبيعًا', desc: 'منتجات متجرك الرائجة', icon: '🏆', enabled: true, order: 3 },
  { id: 'featured', title: 'منتجات مميزة', desc: 'اختيارات مميزة من متجرك', icon: '⭐', enabled: true, order: 4 },
  { id: 'services', title: 'خدمات المتجر', desc: 'الشحن والإرجاع والدفع', icon: '🚚', enabled: true, order: 5 },
];

const WEB_STORE_URL = String(import.meta.env.VITE_WEB_STORE_URL || 'https://enchanting-miracle-production-a5d2.up.railway.app').replace(/\/$/, '');

const normalizeSections = (items) => {
  const source = Array.isArray(items) ? items : [];
  const byId = new Map(source.map((item) => [String(item?.id || ''), item]));
  return DEFAULT_SECTIONS.map((fallback, index) => {
    const item = byId.get(fallback.id);
    return {
      ...fallback,
      enabled: item?.enabled !== false,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index,
    };
  }).sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index }));
};

export default function StoreCustomizerPage() {
  const { merchant } = useMerchantAuth();
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('mobile');
  const [dragged, setDragged] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get('/merchants/me/storefront')
      .then(({ data }) => {
        if (!alive) return;
        setSections(normalizeSections(data?.storefront?.pageLayouts?.home));
      })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.message || 'تعذر تحميل تخصيص المتجر');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const enabledCount = useMemo(() => sections.filter((item) => item.enabled).length, [sections]);

  const move = (from, to) => {
    if (from == null || from === to) return;
    setSections((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((entry, index) => ({ ...entry, order: index }));
    });
  };

  const toggle = (id) => {
    setSections((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
    setMessage('');
    setError('');
  };

  const save = async () => {
    if (!merchant?._id || saving) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put('/merchants/me/storefront', { storefront: { pageLayouts: { home: sections } } });
      setMessage('تم حفظ تخصيص متجرك بنجاح.');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حفظ تخصيص المتجر');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('إرجاع الصفحة الرئيسية لمتجرك للوضع الافتراضي؟')) return;
    setSections(DEFAULT_SECTIONS);
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await api.put('/merchants/me/storefront', { storefront: { pageLayouts: { home: DEFAULT_SECTIONS } } });
      setMessage('تمت إعادة التخصيص للوضع الافتراضي.');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حفظ الإعداد الافتراضي');
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = merchant?._id ? WEB_STORE_URL + '/?merchant=' + encodeURIComponent(String(merchant._id)) : WEB_STORE_URL;

  return (
    <div className="merchant-page" dir="rtl">
      <style>{css}</style>
      <header className="merchant-page-hero">
        <div>
          <span className="page-kicker">MYBRAND · STORE BUILDER</span>
          <h1>تخصيص المتجر</h1>
          <p>هذا التخصيص مرتبط بمتجرك أنت، والمعاينة تفتح متجر MYBRAND الحالي بنفس هوية متجرك ومنتجاته.</p>
        </div>
        <div className="builder-identity">
          <strong>{merchant?.storeName || merchant?.businessName || 'متجري'}</strong>
          <small>{merchant?.businessDescription || 'متجر داخل منصة MYBRAND'}</small>
        </div>
      </header>

      {message && <div className="builder-alert success">{message}</div>}
      {error && <div className="builder-alert error">{error}</div>}

      <section className="builder-grid">
        <div className="builder-card">
          <div className="builder-head">
            <div><span>HOME LAYOUT</span><h2>مكونات الصفحة الرئيسية</h2></div>
            <strong>{enabledCount}/{sections.length} مفعّل</strong>
          </div>

          {loading ? <div className="builder-loading">جارٍ تحميل تخصيص متجرك…</div> : (
            <div className="builder-list">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={'builder-row ' + (!section.enabled ? 'off' : '') + (dragged === index ? ' dragging' : '')}
                  draggable
                  onDragStart={() => setDragged(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => { move(dragged, index); setDragged(null); }}
                  onDragEnd={() => setDragged(null)}
                >
                  <span className="drag">⠿</span>
                  <span className="num">{index + 1}</span>
                  <span className="icon">{section.icon}</span>
                  <div className="copy"><b>{section.title}</b><small>{section.desc}</small></div>
                  <button type="button" className={'switch ' + (section.enabled ? 'on' : '')} onClick={() => toggle(section.id)}><i /></button>
                </div>
              ))}
            </div>
          )}

          <div className="builder-actions">
            <button type="button" className="ghost" onClick={reset} disabled={saving}>إعادة الضبط</button>
            <button type="button" className="primary" onClick={save} disabled={saving || loading}>{saving ? 'جارٍ الحفظ…' : 'حفظ تخصيص المتجر'}</button>
          </div>
        </div>

        <div className="builder-card preview-card">
          <div className="builder-head">
            <div><span>STORE PREVIEW</span><h2>معاينة المتجر الحقيقي</h2></div>
            <div className="preview-actions"><button type="button" className={preview === 'mobile' ? 'active' : ''} onClick={() => setPreview('mobile')}>📱</button><button type="button" className={preview === 'desktop' ? 'active' : ''} onClick={() => setPreview('desktop')}>🖥️</button></div>
          </div>
          <div className={'fake-store ' + preview}>
            <div className="fake-top"><b>{merchant?.storeName || 'MYBRAND'}</b><span>⌕　♡　🛒</span></div>
            {sections.filter((item) => item.enabled).map((section) => <div className="fake-section" key={section.id}><span>{section.icon}</span><div><b>{section.title}</b><small>{section.desc}</small></div></div>)}
          </div>
          <div className="open-store-box">
            <div><b>هذه هي وجهة المعاينة الصحيحة</b><small>لن يتم فتح متجر مختلف؛ الرابط يستخدم موقع MYBRAND الحالي مع معرف متجرك.</small></div>
            <button type="button" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>فتح متجري الحالي ↗</button>
          </div>
        </div>
      </section>
    </div>
  );
}

const css = `
.merchant-page{font-family:Tajawal,sans-serif}.merchant-page-hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.builder-identity{min-width:240px;background:#fff;border:1px solid #ECEEF5;border-radius:16px;padding:16px 18px;box-shadow:0 8px 28px rgba(24,26,50,.05)}.builder-identity strong,.builder-identity small{display:block}.builder-identity strong{font-size:15px}.builder-identity small{color:#7B8198;font-size:11px;line-height:1.6;margin-top:5px}.builder-alert{padding:12px 14px;border-radius:12px;margin:14px 0;font-size:12px}.builder-alert.success{background:#ECFDF3;color:#166534;border:1px solid #BBF7D0}.builder-alert.error{background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA}.builder-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.85fr);gap:18px;margin-top:18px}.builder-card{background:#fff;border:1px solid #ECEEF5;border-radius:18px;padding:18px;box-shadow:0 8px 30px rgba(24,26,50,.05)}.builder-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.builder-head span{display:block;color:#A0A5B5;font-size:9px;font-weight:900;letter-spacing:1.5px}.builder-head h2{margin:4px 0 0;font-size:18px}.builder-head>strong{font-size:11px;background:#F6F7FB;border-radius:999px;padding:7px 10px}.builder-list{display:grid;gap:8px}.builder-row{display:grid;grid-template-columns:28px 30px 34px 1fr 42px;align-items:center;gap:8px;padding:11px;border:1px solid #ECEEF5;border-radius:12px;background:#FBFCFE}.builder-row.off{opacity:.55}.builder-row.dragging{opacity:.55;transform:scale(.99)}.drag,.num{color:#9AA0B2;font-size:11px;text-align:center}.num{font-weight:900}.icon{font-size:18px;text-align:center}.copy b,.copy small{display:block}.copy b{font-size:12px}.copy small{color:#7B8198;font-size:10px;margin-top:3px}.switch{width:38px;height:22px;border:0;border-radius:99px;background:#D9DDE7;padding:3px;cursor:pointer}.switch i{display:block;width:16px;height:16px;border-radius:50%;background:#fff;transition:.18s}.switch.on{background:#17182B}.switch.on i{transform:translateX(-16px)}.builder-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}.ghost,.primary{border-radius:10px;padding:10px 14px;font:800 11px Tajawal;cursor:pointer}.ghost{border:1px solid #E2E5ED;background:#fff;color:#555D72}.primary{border:0;background:linear-gradient(135deg,#17182B,#7257FF);color:#fff}.primary:disabled,.ghost:disabled{opacity:.55;cursor:not-allowed}.preview-actions{display:flex;gap:5px}.preview-actions button{border:1px solid #E2E5ED;background:#fff;border-radius:8px;width:34px;height:32px;cursor:pointer}.preview-actions button.active{background:#17182B;color:#fff}.fake-store{margin-top:8px;border:1px solid #E2E5ED;border-radius:16px;background:#F7F8FB;padding:12px;min-height:420px}.fake-store.mobile{max-width:330px;margin-left:auto;margin-right:auto}.fake-top{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;background:#fff;border-radius:11px;font-size:12px}.fake-section{margin-top:9px;padding:14px;background:#fff;border-radius:12px;display:flex;gap:10px;align-items:center;border:1px solid #EEF0F5}.fake-section>span{font-size:21px}.fake-section b,.fake-section small{display:block}.fake-section b{font-size:12px}.fake-section small{font-size:10px;color:#8990A4;margin-top:2px}.open-store-box{margin-top:12px;border:1px dashed #D8DCE7;background:#FAFBFD;border-radius:12px;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:10px}.open-store-box small{display:block;color:#7B8198;font-size:10px;margin-top:3px}.open-store-box button{border:0;border-radius:9px;padding:9px 12px;background:#17182B;color:#fff;font:800 10px Tajawal;cursor:pointer}.builder-loading{padding:55px 10px;text-align:center;color:#7B8198;font-size:12px}@media(max-width:900px){.builder-grid{grid-template-columns:1fr}.merchant-page-hero{display:block}.builder-identity{margin-top:12px}.open-store-box{display:block}.open-store-box button{margin-top:10px;width:100%}}`;
