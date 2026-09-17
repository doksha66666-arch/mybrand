import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useMerchantAuth } from '../context/MerchantAuthContext';

const EMPTY_FORM = {
  businessName: '',
  storeName: '',
  businessPhone: '',
  businessDescription: '',
  businessAddress: '',
};

const normalize = (value) => String(value ?? '').trim();

const fromMerchant = (merchant) => ({
  businessName: merchant?.businessName || '',
  storeName: merchant?.storeName || '',
  businessPhone: merchant?.businessPhone || '',
  businessDescription: merchant?.businessDescription || '',
  businessAddress: merchant?.businessAddress || '',
});

export default function ProfilePage() {
  const { merchant, refresh } = useMerchantAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    const next = fromMerchant(merchant);
    setForm(next);
    setSavedForm(next);
    setSaved(false);
    setError('');
  }, [merchant]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !dirty) return;

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, normalize(value)]),
    );

    if (!payload.businessName || !payload.storeName) {
      setError('اسم النشاط واسم المتجر مطلوبان.');
      return;
    }

    setError('');
    setSaved(false);
    setSaving(true);

    try {
      await api.put('/merchants/me', payload);
      await refresh();
      setForm(payload);
      setSavedForm(payload);
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const initials = (merchant?.businessName || 'M').trim().slice(0, 1).toUpperCase();

  return (
    <div className="merchant-page profile-page" dir="rtl">
      <header className="merchant-page-hero compact">
        <div>
          <span className="page-kicker">MYBRAND · ACCOUNT</span>
          <h1>بيانات المتجر</h1>
          <p>حدّث بيانات نشاطك والمتجر كما تظهر داخل تجربة التاجر.</p>
        </div>
        <div className="profile-avatar-large" aria-hidden="true">{initials}</div>
      </header>

      <section className="profile-layout">
        <aside className="profile-side-card">
          <div className="profile-avatar-xl" aria-hidden="true">{initials}</div>
          <div>
            <h2>{merchant?.businessName || 'متجري'}</h2>
            <p>{merchant?.storeName || 'متجر MYBRAND'}</p>
            <span className="profile-status"><i /> حساب التاجر</span>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="profile-form" noValidate>
          {error && <div className="page-alert error" role="alert">{error}</div>}
          {saved && <div className="page-alert success" role="status">تم حفظ التعديلات بنجاح</div>}

          <div className="form-section-title">
            <span>01</span>
            <div><strong>بيانات النشاط</strong><small>المعلومات الأساسية للمتجر</small></div>
          </div>

          <div className="form-grid">
            <label>
              اسم النشاط التجاري
              <input value={form.businessName} onChange={handleChange('businessName')} maxLength={120} required />
            </label>
            <label>
              اسم المتجر
              <input value={form.storeName} onChange={handleChange('storeName')} maxLength={120} required />
            </label>
            <label>
              رقم هاتف النشاط
              <input value={form.businessPhone} onChange={handleChange('businessPhone')} inputMode="tel" autoComplete="tel" maxLength={30} />
            </label>
            <label>
              عنوان النشاط
              <input value={form.businessAddress} onChange={handleChange('businessAddress')} maxLength={240} />
            </label>
            <label className="full">
              وصف المتجر
              <textarea value={form.businessDescription} onChange={handleChange('businessDescription')} rows={5} maxLength={1000} />
            </label>
          </div>

          <button className="profile-save" type="submit" disabled={saving || !dirty}>
            {saving ? 'جارٍ الحفظ...' : dirty ? 'حفظ التعديلات' : 'لا توجد تعديلات'}
          </button>
        </form>
      </section>
    </div>
  );
}
