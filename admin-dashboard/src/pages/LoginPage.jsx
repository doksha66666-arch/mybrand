import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'تعذر تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>MYBRAND — لوحة التحكم</h1>
        {error && <p style={styles.error}>{error}</p>}
        <input
          style={styles.input}
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button style={{ ...styles.button, opacity: submitting ? 0.7 : 1 }} type="submit" disabled={submitting}>
          {submitting ? 'جارٍ الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' },
  form: { background: '#fff', padding: 32, borderRadius: 16, width: 340, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  title: { fontSize: 20, marginBottom: 20, textAlign: 'center', color: '#0F172A' },
  input: { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxSizing: 'border-box' },
  button: { width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#DC2626', marginBottom: 12, fontSize: 14 },
};
