import React, { useEffect, useState } from 'react';
import TrendPage from './TrendPage';
import StoryStudioManager from '../components/StoryStudioManager';

const tabs = [
  { id: 'content', label: '📝 منشورات + ريلز' },
  { id: 'events', label: '📅 فعاليات' },
  { id: 'stories', label: '📱 القصص' },
];

export default function TrendHubPage() {
  const [active, setActive] = useState('content');

  useEffect(() => {
    if (active === 'stories') return undefined;
    const timer = window.setTimeout(() => {
      const buttons = document.querySelectorAll('.trend-admin .trend-tabs .trend-tab');
      const index = active === 'events' ? 1 : 0;
      if (buttons[index]) buttons[index].click();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <div dir="rtl" style={{ position: 'relative' }}>
      <section
        aria-label="استديو الترند"
        style={{
          background: '#fff',
          border: '1px solid #EAECF0',
          borderRadius: 18,
          padding: 10,
          margin: '18px 28px 0',
          boxShadow: '0 6px 22px rgba(16,24,40,.05)',
          position: 'sticky',
          top: 10,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length},minmax(0,1fr))`, gap: 8 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              style={{
                border: active === tab.id ? '1px solid #111827' : '1px solid #E2E8F0',
                background: active === tab.id ? '#111827' : '#fff',
                color: active === tab.id ? '#fff' : '#334155',
                borderRadius: 12,
                padding: '12px 10px',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {active === 'stories' ? <StoryStudioManager /> : <TrendPage key={active} />}

      <style>{`
        .trend-admin .trend-tabs { display: none !important; }
        @media (max-width: 650px) {
          [aria-label="استديو الترند"] { margin-left: 16px !important; margin-right: 16px !important; }
          [aria-label="استديو الترند"] div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
