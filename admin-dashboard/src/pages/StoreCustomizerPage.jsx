import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './StoreCustomizerPage.css';

const PAGE_DEFS = [
  { id: 'home', title: 'الرئيسية', path: '/', icon: '🏠', sections: [
    ['hero','البانر الرئيسي','العروض والصور الرئيسية','🖼️'],['categories','الأقسام','أقسام المتجر','🏷️'],['offers','العروض والخصومات','العروض الحالية','🔥'],['featured','منتجات مميزة','منتجات تختارها','⭐'],['best','الأكثر مبيعًا','منتجات رائجة','🏆'],['new','وصل حديثًا','أحدث المنتجات','🆕'],['why','لماذا MYBRAND','مزايا وثقة العملاء','💎'],['services','خدمات المتجر','الدفع والشحن والدعم','🚚']] },
  { id: 'categories', title: 'الأقسام', path: '/categories', icon: '🏷️', sections: [['header','رأس الصفحة','عنوان ووصف الأقسام','🧭'],['categoryGrid','شبكة الأقسام','بطاقات الأقسام والصور','🗂️'],['featured','أقسام مميزة','اختيارات المتجر','⭐']] },
  { id: 'search', title: 'البحث', path: '/search', icon: '🔎', sections: [['searchBox','شريط البحث','البحث والفلاتر','🔎'],['filters','الفلاتر','الفرز والتصفية','⚙️'],['results','نتائج البحث','شبكة المنتجات','🛍️'],['empty','الحالة الفارغة','رسالة عدم وجود نتائج','📭']] },
  { id: 'product', title: 'تفاصيل المنتج', path: '/products/:slug', icon: '🛍️', sections: [['gallery','صور المنتج','المعرض والصور المصغرة','🖼️'],['info','معلومات المنتج','العنوان والسعر والتقييم','ℹ️'],['options','اختيارات المنتج','الألوان والمقاسات والكمية','🎨'],['buy','أزرار الشراء','اشترِ الآن وأضف للسلة','🛒'],['details','التفاصيل','الوصف والمواصفات','📋'],['related','منتجات مشابهة','اقتراحات للعميل','✨']] },
  { id: 'cart', title: 'السلة', path: '/cart', icon: '🛒', sections: [['items','المنتجات','عناصر السلة والكميات','🛍️'],['coupon','كود الخصم','حقل الكوبون','🎟️'],['summary','ملخص الطلب','الإجمالي والشحن','🧾'],['actions','إجراءات السلة','متابعة التسوق وإتمام الطلب','➡️']] },
  { id: 'checkout', title: 'إتمام الطلب', path: '/checkout', icon: '💳', sections: [['steps','مراحل الطلب','معلومات العميل والدفع','1️⃣'],['customer','بيانات العميل','الاسم والهاتف والبريد','👤'],['address','العنوان','المحافظة والمركز والعنوان','📍'],['payment','الدفع','طريقة الدفع والتأكيد','💳'],['summary','ملخص الطلب','المنتجات والإجمالي','🧾']] },
  { id: 'orders', title: 'الطلبات', path: '/orders', icon: '📦', sections: [['header','رأس الصفحة','عنوان الطلبات','📦'],['list','قائمة الطلبات','الحالات والتفاصيل','🧾'],['empty','لا توجد طلبات','الحالة الفارغة','📭']] },
  { id: 'wishlist', title: 'المفضلة', path: '/wishlist', icon: '❤️', sections: [['header','رأس الصفحة','عنوان المفضلة','❤️'],['products','المنتجات المفضلة','بطاقات المنتجات','🛍️'],['empty','لا توجد مفضلة','الحالة الفارغة','📭']] },
  { id: 'account', title: 'الحساب', path: '/account', icon: '👤', sections: [['profile','الملف الشخصي','الصورة والبيانات','👤'],['navigation','تنقل الحساب','الطلبات والمفضلة والإعدادات','🧭'],['orders','طلباتي','ملخص الطلبات','📦'],['address','بيانات الحساب','الهاتف والمحافظة والمركز','📍'],['actions','إجراءات الحساب','تسجيل الخروج وإدارة الحساب','⚙️']] },
  { id: 'login', title: 'تسجيل الدخول', path: '/login', icon: '🔐', sections: [['brand','هوية الصفحة','الشعار والصورة','✨'],['form','نموذج الدخول','البريد/الهاتف وكلمة المرور','🔐'],['actions','الأزرار','الدخول وإنشاء الحساب','➡️']] },
  { id: 'register', title: 'إنشاء حساب', path: '/register', icon: '📝', sections: [['brand','هوية الصفحة','الشعار والصورة','✨'],['form','بيانات التسجيل','الاسم والهاتف والبريد','📝'],['location','الموقع','المحافظة والمركز','📍'],['actions','الأزرار','إنشاء الحساب وتسجيل الدخول','➡️']] },
  { id: 'about', title: 'من نحن', path: '/about', icon: '🏪', sections: [['hero','العنوان الرئيسي','صورة وهوية المتجر','🖼️'],['story','قصتنا','نبذة ورسالة المتجر','📖'],['values','قيمنا','المميزات والثقة','💎']] },
  { id: 'contact', title: 'تواصل معنا', path: '/contact', icon: '📞', sections: [['hero','رأس الصفحة','العنوان والوصف','📞'],['channels','قنوات التواصل','الهاتف والبريد والسوشيال','💬'],['form','نموذج التواصل','رسالة العميل','📝']] },
  { id: 'privacy', title: 'الخصوصية', path: '/privacy', icon: '🔒', sections: [['header','رأس الصفحة','عنوان السياسة','🔒'],['content','محتوى السياسة','الأقسام والنصوص','📄']] },
  { id: 'terms', title: 'الشروط والأحكام', path: '/terms', icon: '📄', sections: [['header','رأس الصفحة','عنوان الشروط','📄'],['content','محتوى الشروط','الأقسام والنصوص','📋']] },
];

const makeDefaults = (page) => page.sections.map(([id,title,desc,icon], index) => ({ id, title, desc, icon, enabled: true, order: index }));

export default function StoreCustomizerPage() {
  const [pageId, setPageId] = useState('home');
  const [layouts, setLayouts] = useState({});
  const [dragged, setDragged] = useState(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState('mobile');

  const page = PAGE_DEFS.find((item) => item.id === pageId) || PAGE_DEFS[0];
  const sections = layouts[pageId] || makeDefaults(page);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mybrand_store_page_layouts') || '{}');
      if (stored && typeof stored === 'object') setLayouts(stored);
    } catch {}
  }, []);

  const updateSections = (next) => setLayouts((current) => ({ ...current, [pageId]: next }));

  const move = (from, to) => {
    if (from === to) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateSections(next);
  };

  const toggle = (id) => updateSections(sections.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));

  const save = () => {
    const next = { ...layouts, [pageId]: sections };
    localStorage.setItem('mybrand_store_page_layouts', JSON.stringify(next));
    setLayouts(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const reset = () => {
    if (!confirm(`إرجاع تخصيص صفحة ${page.title} للوضع الافتراضي؟`)) return;
    const next = { ...layouts, [pageId]: makeDefaults(page) };
    setLayouts(next);
    localStorage.setItem('mybrand_store_page_layouts', JSON.stringify(next));
  };

  const enabledCount = useMemo(() => sections.filter((item) => item.enabled).length, [sections]);

  return (
    <div className="store-customizer" dir="rtl">
      <header className="customizer-head">
        <div><span className="customizer-kicker">MYBRAND STORE BUILDER</span><h1>تخصيص كل صفحات المتجر</h1><p>اختر أي صفحة، ثم اسحب عناصرها ورتبها أو أخفِ ما لا تريد ظهوره.</p></div>
        <div className="customizer-actions"><button className="secondary-btn" onClick={reset}>إعادة ضبط الصفحة</button><button className="primary-btn" onClick={save}>{saved ? '✓ تم الحفظ' : 'حفظ التخصيص'}</button></div>
      </header>

      <section className="page-selector">
        <div className="page-selector-title"><span>STORE PAGES</span><strong>{PAGE_DEFS.length} صفحة قابلة للتخصيص</strong></div>
        <div className="page-tabs">{PAGE_DEFS.map((item) => <button key={item.id} className={item.id === pageId ? 'active' : ''} onClick={() => { setPageId(item.id); setDragged(null); }}>{item.icon}<span>{item.title}</span></button>)}</div>
      </section>

      <div className="builder-layout">
        <section className="builder-panel">
          <div className="panel-title"><div><span>{page.path}</span><h2>{page.icon} {page.title}</h2></div><strong>{enabledCount} مفعّل</strong></div>
          <div className="section-list">{sections.map((section, index) => <div key={section.id} draggable onDragStart={() => setDragged(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragged !== null) move(dragged,index); setDragged(null); }} className={`section-row ${!section.enabled ? 'disabled' : ''} ${dragged === index ? 'dragging' : ''}`}><span className="drag-handle">⠿</span><span className="section-number">{index + 1}</span><span className="section-icon">{section.icon}</span><div className="section-copy"><strong>{section.title}</strong><small>{section.desc}</small></div><button className={`switch ${section.enabled ? 'on' : ''}`} onClick={() => toggle(section.id)} aria-label="تفعيل القسم"><span /></button></div>)}</div>
          <div className="tip"><span>✦</span><div><strong>اسحب من علامة ⠿</strong><small>التخصيص محفوظ لكل صفحة بشكل مستقل.</small></div></div>
        </section>

        <section className="preview-panel"><div className="preview-head"><div><span>LIVE PREVIEW</span><h2>معاينة {page.title}</h2></div><div className="preview-switch"><button className={preview === 'mobile' ? 'active' : ''} onClick={() => setPreview('mobile')}>📱 موبايل</button><button className={preview === 'desktop' ? 'active' : ''} onClick={() => setPreview('desktop')}>🖥️ كمبيوتر</button></div></div><div className={`store-preview ${preview}`}><div className="fake-header"><b>MYBRAND</b><span>⌕　♡　🛒</span></div>{sections.filter((s) => s.enabled).map((section) => <div key={section.id} className={`fake-section fake-${section.id}`}><span>{section.icon}</span><strong>{section.title}</strong><small>{section.desc}</small></div>)}</div></section>
      </div>

      <div className="customizer-links"><Link to="/banners">إدارة البنرات ←</Link><Link to="/campaigns">إدارة الحملات والعروض ←</Link></div>
    </div>
  );
}
