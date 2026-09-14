import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnifiedLoginPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper} dir="rtl">
      <div style={styles.card}>
        <div style={styles.logo}>M</div>
        <h1 style={styles.title}>MYBRAND</h1>
        <p style={styles.subtitle}>اختر نوع الدخول</p>

        <div style={styles.actions}>
          <button type="button" style={{ ...styles.choice, ...styles.merchant }} onClick={() => navigate('/merchant-login')}>
            <span style={styles.icon}>🛍️</span>
            <span>
              <b style={styles.choiceTitle}>تسجيل دخول التاجر</b>
              <small style={styles.choiceText}>الوصول إلى لوحة المتجر والطلبات والمنتجات</small>
            </span>
            <span style={styles.arrow}>←</span>
          </button>

          <button type="button" style={{ ...styles.choice, ...styles.admin }} onClick={() => navigate('/admin')}>
            <span style={styles.icon}>🛡️</span>
            <span>
              <b style={styles.choiceTitle}>تسجيل دخول الأدمن</b>
              <small style={styles.choiceText}>إدارة المنصة والتجار والمستخدمين والإعدادات</small>
            </span>
            <span style={styles.arrow}>←</span>
          </button>
        </div>

        <div style={styles.note}>كل حساب يدخل تلقائيًا بالجلسة والصلاحيات الخاصة به.</div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#7f1d1d 100%)', boxSizing: 'border-box' },
  card: { width: '100%', maxWidth: 560, padding: 34, borderRadius: 28, background: 'rgba(255,255,255,.97)', boxShadow: '0 30px 80px rgba(0,0,0,.28)', textAlign: 'center' },
  logo: { width: 62, height: 62, margin: '0 auto 12px', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#D4AF37', fontSize: 30, fontWeight: 800 },
  title: { margin: 0, color: '#0f172a', fontSize: 28, letterSpacing: 2 },
  subtitle: { margin: '8px 0 24px', color: '#64748b', fontSize: 15 },
  actions: { display: 'grid', gap: 14 },
  choice: { display: 'grid', gridTemplateColumns: '52px 1fr 24px', alignItems: 'center', gap: 14, width: '100%', padding: '18px 16px', borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'right', transition: 'transform .18s ease, box-shadow .18s ease' },
  merchant: { boxShadow: '0 10px 26px rgba(15,23,42,.08)' },
  admin: { boxShadow: '0 10px 26px rgba(127,29,29,.08)' },
  icon: { width: 52, height: 52, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontSize: 24 },
  choiceTitle: { display: 'block', color: '#0f172a', fontSize: 16, marginBottom: 5 },
  choiceText: { display: 'block', color: '#64748b', fontSize: 12, lineHeight: 1.6 },
  arrow: { color: '#94a3b8', fontSize: 20 },
  note: { marginTop: 20, color: '#94a3b8', fontSize: 11 },
};
