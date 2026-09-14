import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function ProfilePage() {
  const { merchant, refresh } = useMerchantAuth();
  const [form, setForm] = useState({ businessName: '', storeName: '', businessPhone: '', businessDescription: '', businessAddress: '' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    setForm({ businessName: merchant.businessName || '', storeName: merchant.storeName || '', businessPhone: merchant.businessPhone || '', businessDescription: merchant.businessDescription || '', businessAddress: merchant.businessAddress || '' });
  }, [merchant]);

  const handleChange = (field) => (e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setSaved(false); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaved(false); setSaving(true);
    try { await api.put('/merchants/me', form); await refresh(); setSaved(true); }
    catch (err) { setError(err?.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات'); }
    finally { setSaving(false); }
  };

  return (
    <div className="merchant-page profile-page" dir="rtl">
      <header className="merchant-page-hero compact">
        <div><span className="page-kicker">MYBRAND · ACCOUNT</span><h1>البروفايل</h1><p>حدّث بيانات نشاطك والمتجر كما تظهر للعملاء.</p></div>
        <div className="profile-avatar-large">{(merchant?.businessName || 'M').slice(0, 1).toUpperCase()}</div>
      </header>

      <section className="profile-layout">
        <aside className="profile-side-card"><div className="profile-avatar-xl">{(merchant?.businessName || 'M').slice(0, 1).toUpperCase()}</div><h2>{merchant?.businessName || 'متجري'}</h2><p>{merchant?.storeName || 'متجر MYBRAND'}</p><span className="profile-status"><i /> حساب التاجر</span></aside>
        <form onSubmit={handleSubmit} className="profile-form">
          {error && <div className="page-alert error">{error}</div>}
          {saved && <div className="page-alert success">تم حفظ التعديلات بنجاح</div>}
          <div className="form-section-title"><span>01</span><div><strong>بيانات النشاط</strong><small>المعلومات الأساسية للمتجر</small></div></div>
          <div className="form-grid">
            <label>اسم النشاط التجاري<input value={form.businessName} onChange={handleChange('businessName')} required /></label>
            <label>اسم المتجر<input value={form.storeName} onChange={handleChange('storeName')} required /></label>
            <label>رقم هاتف النشاط<input value={form.businessPhone} onChange={handleChange('businessPhone')} inputMode="tel" /></label>
            <label>عنوان النشاط<input value={form.businessAddress} onChange={handleChange('businessAddress')} /></label>
            <label className="full">وصف المتجر<textarea value={form.businessDescription} onChange={handleChange('businessDescription')} rows={5} /></label>
          </div>
          <button className="profile-save" type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</button>
        </form>
      </section>
    </div>
  );
}
