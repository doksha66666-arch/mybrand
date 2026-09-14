import React from 'react';
import { Link } from 'react-router-dom';

export default function StudioPage() {
  return <div className="merchant-page studio-page" dir="rtl">
    <header className="merchant-page-hero">
      <div><span className="page-kicker">MYBRAND · CREATOR</span><h1>استديو المحتوى</h1><p>مساحتك السريعة لصناعة ونشر محتوى متجرك على MYBRAND.</p></div>
      <div className="studio-badge"><span>✦</span><small>بدون LIVE</small></div>
    </header>
    <Link to="/studio/trend" className="studio-feature-card">
      <div className="studio-feature-icon">✦</div>
      <div className="studio-feature-copy"><span>TREND STUDIO</span><h2>استديو الترند</h2><p>أنشئ منشورات، ريلز، قصص وفعاليات، واربطها بمنتجات متجرك فقط.</p><strong>فتح استديو الترند <b>←</b></strong></div>
    </Link>
  </div>;
}
