import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function SocialAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('جارٍ إتمام تسجيل الدخول...');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('social_error');
    if (error) { setMessage(error); setTimeout(() => navigate('/login', { replace: true }), 2200); return; }
    if (!token) { setMessage('تعذر إتمام تسجيل الدخول.'); setTimeout(() => navigate('/login', { replace: true }), 2200); return; }
    localStorage.setItem('mybrand_token', token);
    let resume = null;
    try {
      const raw = localStorage.getItem('mybrand_social_return');
      if (raw) resume = JSON.parse(raw);
      localStorage.removeItem('mybrand_social_return');
    } catch (_) {}
    const returnTo = typeof resume?.returnTo === 'string' && resume.returnTo.startsWith('/') ? resume.returnTo : '/';
    const returnState = resume?.checkoutState || undefined;
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(() => navigate(returnTo, { replace: true, state: returnState }))
      .catch(() => { localStorage.removeItem('mybrand_token'); setMessage('تعذر التحقق من جلسة تسجيل الدخول.'); setTimeout(() => navigate('/login', { replace: true }), 2200); });
  }, [navigate, searchParams]);

  return <main dir="rtl" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}><div style={{ textAlign: 'center', background: '#fff', borderRadius: 18, padding: '34px 26px', boxShadow: '0 10px 34px rgba(15,23,42,.08)' }}><h2>MYBRAND</h2><p style={{ color: '#64748B' }}>{message}</p></div></main>;
}
