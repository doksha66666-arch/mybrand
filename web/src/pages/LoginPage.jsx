import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ORIGIN } from '../api/client';
import './LoginPage.css';
import { useStoreLayout } from '../context/StoreLayoutContext';

const API_BASE = `${API_ORIGIN}/api`;
const socialLogin = (provider) => window.location.assign(`${API_BASE}/auth/${provider}`);

export default function LoginPage() {
  const { getStyle } = useStoreLayout('login');
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [searchParams] = useSearchParams();
  const returnTo = location.state?.returnTo || '/'; const returnState = location.state?.checkoutState || undefined;
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { const socialError = searchParams.get('social_error'); if (socialError) setError(socialError); }, [searchParams]);
  const submit = async (e) => { e.preventDefault(); setError(''); setSubmitting(true); try { await login(email, password); navigate(returnTo, { replace: true, state: returnState }); } catch (err) { if (err?.response?.data?.needsVerification) { navigate(`/verify-email?email=${encodeURIComponent(err.response.data.email || email)}`, { state: { returnTo, checkoutState: returnState } }); return; } setError(err?.response?.data?.message || 'تعذر تسجيل الدخول'); } finally { setSubmitting(false); } };

  return <div className="app">
    <div className="topbar" style={getStyle('topbar')}><button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="رجوع"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg></button><button type="button" className="skip-link" onClick={() => navigate('/')}>تخطي</button></div>
    <div className="hero-block" style={getStyle('hero')}><div className="logo-mark">M</div><h1>أهلاً بيك في MYBRAND</h1><p>سجّل دخولك باستخدام البريد الإلكتروني وكلمة المرور.</p></div>
    <form className="form" style={getStyle('form')} onSubmit={submit}>
      <div className="field"><label>البريد الإلكتروني</label><div className="input-wrap"><input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div></div>
      <div className="field"><label>كلمة المرور</label><div className="input-wrap"><input type={showPassword ? 'text' : 'password'} placeholder="ادخل كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required style={{ paddingInlineStart: 0 }} /><button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>
      <div className="forgot-row"><Link to="/forgot-password">نسيت كلمة المرور؟</Link></div><button className="primary-btn gradient" type="submit" disabled={submitting}>{submitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</button>{error && <div className="login-error" role="alert">{error}</div>}
    </form>
    <div className="divider"><div className="line"></div>أو تسجيل الدخول عن طريق<div className="line"></div></div>
    <div className="social-row" style={getStyle('social')}><button type="button" className="social-btn" onClick={() => socialLogin('google')}><svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.5 12 2.5 6.9 2.5 2.8 6.7 2.8 11.8s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.1-1.5H12z"/></svg>جوجل</button></div>
    <Link to="/register" className="register-link" style={getStyle('links')}>إنشاء حساب جديد</Link><button type="button" className="guest-link" onClick={() => navigate('/')}>المتابعة كزائر</button><div className="terms">بتسجيل الدخول إنت موافق على <Link to="/terms">الشروط والأحكام</Link> و<Link to="/privacy">سياسة الخصوصية</Link> الخاصة بمتجر MYBRAND</div>
  </div>;
}
