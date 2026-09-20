import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const redirectToLoginWithError = (navigate, message) => {
  const safeMessage = String(message || 'تعذر إتمام تسجيل الدخول.');
  navigate(`/login?social_error=${encodeURIComponent(safeMessage)}`, { replace: true });
};

export default function SocialAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('جارٍ إتمام تسجيل الدخول...');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('social_error');
    if (error) {
      setMessage(error);
      setTimeout(() => redirectToLoginWithError(navigate, error), 2200);
      return;
    }
    if (!token) {
      const fallback = 'تعذر إتمام تسجيل الدخول.';
      setMessage(fallback);
      setTimeout(() => redirectToLoginWithError(navigate, fallback), 2200);
      return;
    }
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
      .catch(() => {
        localStorage.removeItem('mybrand_token');
        setMessage('تعذر التحقق من جلسة تسجيل الدخول.');
        setTimeout(() => {
          if (resume?.returnTo) {
            try {
              localStorage.setItem('mybrand_social_return', JSON.stringify(resume));
            } catch (_) {}
          }
          redirectToLoginWithError(navigate, 'تعذر التحقق من جلسة تسجيل الدخول.');
        }, 2200);
      });
  }, [navigate, searchParams]);

  return <main dir="rtl" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}><div style={{ textAlign: 'center', background: '#fff', borderRadius: 18, padding: '34px 26px', boxShadow: '0 10px 34px rgba(15,23,42,.08)' }}><h2>MYBRAND</h2><p style={{ color: '#64748B' }}>{message}</p></div></main>;
}
