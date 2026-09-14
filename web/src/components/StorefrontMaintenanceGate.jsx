import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function StorefrontMaintenanceGate({ children }) {
  const [state, setState] = useState({ loading: true, maintenance: false, storeName: 'MYBRAND' });

  useEffect(() => {
    let active = true;
    api.get('/config')
      .then(({ data }) => {
        if (!active) return;
        setState({
          loading: false,
          maintenance: Boolean(data?.store?.maintenance),
          storeName: String(data?.store?.storeName || 'MYBRAND'),
        });
      })
      .catch(() => {
        // Fail open: a config outage must not take the storefront offline.
        if (active) setState((current) => ({ ...current, loading: false }));
      });
    return () => { active = false; };
  }, []);

  if (state.loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#0f172a', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 42, height: 42, margin: '0 auto 14px', border: '4px solid #e2e8f0', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0 }}>جاري تجهيز المتجر...</p>
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      </div>
    );
  }

  if (state.maintenance) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fff7ed', color: '#0f172a', padding: 24 }}>
        <main style={{ width: 'min(620px, 100%)', background: '#fff', border: '1px solid #fed7aa', borderRadius: 24, padding: '44px 28px', textAlign: 'center', boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ width: 68, height: 68, margin: '0 auto 18px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#ffedd5', fontSize: 34 }}>🔧</div>
          <h1 style={{ margin: '0 0 12px', fontSize: 30 }}>{state.storeName} خارج الخدمة مؤقتًا</h1>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.9, fontSize: 16 }}>
            نجري بعض التحسينات على المتجر حاليًا. سنعود للعمل قريبًا، شكرًا لصبركم.
          </p>
        </main>
      </div>
    );
  }

  return children;
}
