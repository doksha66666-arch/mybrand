import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import '../components/AdminShell.css';

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
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'تعذر تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login" dir="rtl">
      <div className="login-decoration login-decoration-a" />
      <div className="login-decoration login-decoration-b" />
      <section className="login-card">
        <div className="login-brand">
          <div className="login-mark">M</div>
          <div><strong>MYBRAND</strong><span>مركز الإدارة</span></div>
        </div>
        <div className="login-copy">
          <span>PRIVATE MANAGEMENT AREA</span>
          <h1>أهلًا بك من جديد</h1>
          <p>سجّل الدخول بحساب المشرف أو حساب أحد أعضاء الفريق المعتمدين.</p>
        </div>
        {error && <div className="login-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <label>البريد الإلكتروني<input type="email" placeholder="name@mybrand.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
          <label>كلمة المرور<input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          <button className="login-submit" type="submit" disabled={submitting}><span>{submitting ? 'جارٍ التحقق...' : 'دخول إلى لوحة التحكم'}</span><b>←</b></button>
        </form>
        <div className="login-foot"><span>الوصول محصور بالحسابات الإدارية المعتمدة</span><span className="login-secure">● اتصال آمن</span></div>
      </section>
    </main>
  );
}
