import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function RegisterPage() {
  const { register } = useMerchantAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    storeName: '',
    businessPhone: '',
    businessDescription: '',
    businessAddress: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إنشاء الحساب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>انضم كتاجر في MYBRAND</h1>
        <p style={styles.subtitle}>بعد التسجيل، سيتم مراجعة طلبك من الإدارة قبل ما تقدر تبيع منتجاتك.</p>
        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.sectionLabel}>بياناتك الشخصية</p>
        <input style={styles.input} placeholder="الاسم الكامل" value={form.name} onChange={handleChange('name')} required />
        <input style={styles.input} type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={handleChange('email')} required />
        <input style={styles.input} placeholder="رقم الهاتف" value={form.phone} onChange={handleChange('phone')} />
        <input style={styles.input} type="password" placeholder="كلمة المرور" value={form.password} onChange={handleChange('password')} required />

        <p style={styles.sectionLabel}>بيانات النشاط التجاري</p>
        <input style={styles.input} placeholder="اسم النشاط التجاري" value={form.businessName} onChange={handleChange('businessName')} required />
        <input style={styles.input} placeholder="اسم المتجر (كما سيظهر للعملاء)" value={form.storeName} onChange={handleChange('storeName')} required />
        <input style={styles.input} placeholder="رقم هاتف النشاط (اختياري)" value={form.businessPhone} onChange={handleChange('businessPhone')} />
        <input style={styles.input} placeholder="عنوان النشاط (اختياري)" value={form.businessAddress} onChange={handleChange('businessAddress')} />
        <textarea style={styles.textarea} placeholder="وصف مختصر عن نشاطك ومنتجاتك (اختياري)" value={form.businessDescription} onChange={handleChange('businessDescription')} />

        <button style={styles.button} type="submit" disabled={submitting}>
          {submitting ? '...جارٍ الإرسال' : 'إرسال طلب الانضمام'}
        </button>
        <p style={styles.linkRow}>
          عندك حساب بالفعل؟ <Link to="/login" style={styles.link}>سجّل دخول</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC', padding: '40px 0' },
  form: { background: '#fff', padding: 32, borderRadius: 16, width: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  title: { fontSize: 18, marginBottom: 6, textAlign: 'center', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 8, marginTop: 12, fontWeight: 600 },
  input: { width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #E2E8F0', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #E2E8F0', boxSizing: 'border-box', minHeight: 70 },
  button: { width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  error: { color: '#DC2626', marginBottom: 12, fontSize: 13 },
  linkRow: { textAlign: 'center', fontSize: 13, marginTop: 14, color: '#64748B' },
  link: { color: '#D4AF37', fontWeight: 600, textDecoration: 'none' },
};
