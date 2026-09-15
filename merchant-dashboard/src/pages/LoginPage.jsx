import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function LoginPage() {
  const { login } = useMerchantAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(normalizedEmail, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'تعذر تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <h1 style={styles.title}>MYBRAND — لوحة التاجر</h1>
        {error && <p style={styles.error} role="alert">{error}</p>}
        <input style={styles.input} type="email" inputMode="email" autoComplete="username" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} required />
        <input style={styles.input} type="password" autoComplete="current-password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} required />
        <button style={{ ...styles.button, opacity: submitting ? 0.7 : 1 }} type="submit" disabled={submitting}>
          {submitting ? 'جارٍ تسجيل الدخول…' : 'دخول'}
        </button>
        <p style={styles.linkRow}>
          لسه معندكش حساب تاجر؟ <Link to="/register" style={styles.link}>سجّل الآن</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20, background: '#F8FAFC', boxSizing: 'border-box' },
  form: { background: '#fff', padding: 32, borderRadius: 16, width: '100%', maxWidth: 360, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', boxSizing: 'border-box' },
  title: { fontSize: 18, marginBottom: 20, textAlign: 'center', color: '#0F172A' },
  input: { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxSizing: 'border-box' },
  button: { width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#DC2626', marginBottom: 12, fontSize: 13 },
  linkRow: { textAlign: 'center', fontSize: 13, marginTop: 14, color: '#64748B' },
  link: { color: '#D4AF37', fontWeight: 600, textDecoration: 'none' },
};
