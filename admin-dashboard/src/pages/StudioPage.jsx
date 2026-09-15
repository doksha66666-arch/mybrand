import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canAccess } from '../utils/permissions';

const Card = ({ to, icon, label, title, text, action, tone = 'dark' }) => (
  <Link to={to} style={styles.link}>
    <section style={{ ...styles.card, ...(tone === 'trend' ? styles.trendCard : styles.liveCard) }}>
      <div style={styles.icon}>{icon}</div>
      <div style={styles.content}>
        <div style={styles.label}>{label}</div>
        <h2 style={styles.cardTitle}>{title}</h2>
        <p style={styles.text}>{text}</p>
        <span style={styles.action}>{action} ←</span>
      </div>
      <div style={styles.arrow}>←</div>
    </section>
  </Link>
);

export default function StudioPage() {
  const { user } = useAdminAuth();
  const canViewLive = canAccess(user, '/live', 'view');
  const canViewTrend = canAccess(user, '/trend', 'view');

  return (
    <div dir="rtl" style={styles.page}>
      <header style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>MYBRAND CONTROL</div>
          <h1 style={styles.title}>استديو MYBRAND</h1>
          <p style={styles.subtitle}>مركز إدارة المحتوى المباشر والترند للمنصة.</p>
        </div>
        <div style={styles.livePill}><span style={styles.liveDot} /> الاستديو</div>
      </header>

      {!canViewLive && !canViewTrend ? (
        <section style={styles.emptyCard}>لا توجد صلاحيات لفتح أي قسم من الاستديو.</section>
      ) : (
        <div style={styles.grid}>
          {canViewLive && <Card to="/live" icon="🎥" label="LIVE STUDIO" title="مباشر" text="تشغيل ومتابعة وإدارة البث المباشر من استديو MYBRAND." action="فتح الاستديو" />}
          {canViewTrend && <Card to="/trend" icon="🔥" label="TREND STUDIO" title="الترند" text="إدارة ونشر المحتوى الحقيقي للمنصة: منشورات، ريلز، فعاليات وقصص." action="فتح استديو الترند" tone="trend" />}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1220, margin: '0 auto', paddingBottom: 30 },
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 22 },
  eyebrow: { color: '#E60023', fontSize: 11, fontWeight: 900, letterSpacing: 2 },
  title: { margin: '7px 0 5px', fontSize: 34, color: '#111827', letterSpacing: '-.5px' },
  subtitle: { margin: 0, color: '#64748B', fontSize: 15 },
  livePill: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 999, padding: '10px 14px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(15,23,42,.05)' },
  liveDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#E60023', marginLeft: 7 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 20 },
  emptyCard: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: 30, textAlign: 'center', color: '#64748B', boxShadow: '0 12px 30px rgba(15,23,42,.06)' },
  link: { display: 'block', textDecoration: 'none', color: 'inherit' },
  card: { minHeight: 300, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 26, padding: 34, borderRadius: 24, color: '#fff', boxShadow: '0 18px 45px rgba(15,23,42,.14)' },
  liveCard: { background: 'linear-gradient(135deg,#E60023 0%,#B9001C 55%,#7A0012 100%)' },
  trendCard: { background: 'linear-gradient(135deg,#111827 0%,#1F2937 52%,#E60023 180%)' },
  icon: { width: 76, height: 76, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 22, background: 'rgba(255,255,255,.13)', fontSize: 38 },
  content: { position: 'relative', zIndex: 1 },
  label: { fontSize: 11, fontWeight: 900, letterSpacing: 2, opacity: .8 },
  cardTitle: { margin: '8px 0 7px', fontSize: 34, fontWeight: 900 },
  text: { margin: 0, maxWidth: 620, fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,.88)' },
  action: { display: 'inline-block', marginTop: 20, padding: '11px 17px', borderRadius: 999, background: '#fff', color: '#111827', fontSize: 12, fontWeight: 900 },
  arrow: { marginRight: 'auto', fontSize: 30, opacity: .5 },
};
