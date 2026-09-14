import React, { useEffect } from 'react';
import TrendPage from './TrendPage';
import ActiveStoriesRow from '../components/ActiveStoriesRow';

function tuneLiveEmbed() {
  const frames = Array.from(document.querySelectorAll('.trend-with-active-stories .live-single-view iframe'));
  frames.forEach((frame) => {
    const apply = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc || !doc.head) return;
        let style = doc.getElementById('mybrand-trend-live-embed-fix');
        if (!style) {
          style = doc.createElement('style');
          style.id = 'mybrand-trend-live-embed-fix';
          doc.head.appendChild(style);
        }
        style.textContent = `html,body,#root{width:100%!important;height:100%!important;min-height:0!important;margin:0!important;overflow:hidden!important}.mybrand-live{width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;overflow:hidden!important;position:relative!important;background:#000!important}.mybrand-live video{width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important;display:block!important;background:#000!important}`;
      } catch (_) {}
    };
    frame.addEventListener('load', apply);
    apply();
  });
}

export default function TrendWithActiveStoriesPage() {
  useEffect(() => {
    const timer = window.setTimeout(tuneLiveEmbed, 80);
    const observer = new MutationObserver(() => tuneLiveEmbed());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, []);

  return (
    <div className="trend-with-active-stories" dir="rtl">
      <style>{`
        .trend-with-active-stories{width:100%;max-width:430px;min-height:100vh;margin:0 auto;padding-bottom:78px;background:#fff;display:flex;flex-direction:column}
        .trend-with-active-stories .trend-app{display:contents!important}
        .trend-with-active-stories .trend-topbar{display:contents!important}
        .trend-with-active-stories .trend-top-row{order:1!important;position:sticky!important;top:0!important;z-index:40!important;background:#fff!important}
        /* ActiveStoriesRow is the single canonical stories strip on the Trend page. */
        .trend-with-active-stories .trend-app .stories-row{display:none!important}
        .trend-with-active-stories .active-stories-row{order:2!important;position:relative!important;width:100%!important;z-index:36!important;background:#fff!important;margin:0!important;padding:14px 6px 18px!important}
        .trend-with-active-stories .trend-seg-tabs{order:3!important;position:relative!important;top:auto!important;z-index:35!important;background:#fff!important}
        .trend-with-active-stories .feed-grid,.trend-with-active-stories .trend-events-section,.trend-with-active-stories .post-card,.trend-with-active-stories .state,.trend-with-active-stories .error-state{order:4!important}
        .trend-with-active-stories .live-single-view{order:4!important;width:100%!important;min-height:calc(100dvh - 116px)!important;display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:2!important}
        .trend-with-active-stories .live-grid{order:4!important;width:100%!important;display:grid!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:2!important}
        .trend-with-active-stories .trend-bottom-nav{order:99!important}
      `}</style>
      <ActiveStoriesRow />
      <TrendPage />
    </div>
  );
}
