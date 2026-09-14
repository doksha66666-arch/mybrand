import React from 'react';
import { Link } from 'react-router-dom';

export default function StudioPage() {
  return <div className="merchant-page studio-page" dir="rtl">
    <header className="merchant-page-hero">
      <div><span className="page-kicker">MYBRAND · CREATOR</span><h1>استديو المحتوى</h1><p>مساحتك السريعة لصناعة ونشر محتوى متجرك على MYBRAND.</p></div>
      <div className="studio-badge"><span>✦</span><small>CONTENT + LIVE</small></div>
    </header>

    <div className="studio-feature-grid">
      <Link to="/studio/trend" className="studio-feature-card">
        <div className="studio-feature-icon">✦</div>
        <div className="studio-feature-copy"><span>TREND STUDIO</span><h2>استديو الترند</h2><p>أنشئ منشورات، ريلز و قصص، واربطها بمنتجات متجرك فقط.</p><strong>فتح استديو الترند <b>←</b></strong></div>
      </Link>

      <Link to="/studio/live" className="studio-feature-card studio-live-card">
        <div className="studio-feature-icon">●</div>
        <div className="studio-feature-copy"><span>LIVE PRESENTATION</span><h2>العروض المباشرة</h2><p>ارفع فيديو جاهزًا، انشره كعرض مباشر، ثم أوقفه أو أعد تشغيله من مكتبتك.</p><strong>فتح غرفة العروض <b>←</b></strong></div>
      </Link>
    </div>
  </div>;
}
