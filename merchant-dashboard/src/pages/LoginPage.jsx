import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function LoginPage() {
  const { login } = useMerchantAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'تعذر تسجيل الدخول');
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>MYBRAND — لوحة التاجر</h1>
        {error && <p style={styles.error}>{error}</p>}
        <input style={styles.input} type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button style={styles.button} type="submit">دخول</button>
        <p style={styles.linkRow}>
          لسه معندكش حساب تاجر؟ <Link to="/register" style={styles.link}>سجّل الآن</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' },
  form: { background: '#fff', padding: 32, borderRadius: 16, width: 360, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  title: { fontSize: 18, marginBottom: 20, textAlign: 'center', color: '#0F172A' },
  input: { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxSizing: 'border-box' },
  button: { width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#DC2626', marginBottom: 12, fontSize: 13 },
  linkRow: { textAlign: 'center', fontSize: 13, marginTop: 14, color: '#64748B' },
  link: { color: '#D4AF37', fontWeight: 600, textDecoration: 'none' },
};
