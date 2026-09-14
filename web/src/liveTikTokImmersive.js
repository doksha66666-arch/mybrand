(() => {
  if (typeof window === 'undefined' || window.__MYBRAND_LIVE_TIKTOK_MODE__) return;
  window.__MYBRAND_LIVE_TIKTOK_MODE__ = true;

  const STYLE_ID = 'mybrand-live-tiktok-immersive-style';
  const LIVE_GRID = '.trend-app .live-grid';

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .trend-app.mybrand-live-immersive {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100dvh !important;
        min-height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: #000 !important;
        overflow: hidden !important;
      }

      .trend-app.mybrand-live-immersive .stories-row,
      .trend-app.mybrand-live-immersive .trend-top-row {
        display: none !important;
      }

      .trend-app.mybrand-live-immersive .trend-topbar {
        position: fixed !important;
        inset: 0 0 auto 0 !important;
        width: 100vw !important;
        height: 56px !important;
        z-index: 80 !important;
        background: linear-gradient(180deg, rgba(0,0,0,.72), rgba(0,0,0,0)) !important;
        padding: 0 !important;
        pointer-events: none !important;
      }

      .trend-app.mybrand-live-immersive .trend-seg-tabs {
        position: absolute !important;
        inset: 0 auto auto 0 !important;
        width: 100% !important;
        height: 56px !important;
        padding: 0 18px !important;
        justify-content: center !important;
        align-items: flex-end !important;
        gap: 26px !important;
        border: 0 !important;
        background: transparent !important;
        pointer-events: auto !important;
      }

      .trend-app.mybrand-live-immersive .trend-seg-tab {
        color: rgba(255,255,255,.72) !important;
        padding-bottom: 13px !important;
        text-shadow: 0 2px 12px rgba(0,0,0,.7) !important;
      }

      .trend-app.mybrand-live-immersive .trend-seg-tab.active {
        color: #fff !important;
      }

      .trend-app.mybrand-live-immersive .trend-seg-tab.active:after {
        background: #fff !important;
      }

      .trend-app.mybrand-live-immersive .live-dot {
        box-shadow: 0 0 0 3px rgba(255,255,255,.18) !important;
      }

      .trend-app.mybrand-live-immersive .live-grid {
        width: 100vw !important;
        max-width: none !important;
        height: 100dvh !important;
        min-height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 0 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        scroll-snap-type: y mandatory !important;
        scroll-behavior: smooth !important;
        overscroll-behavior-y: contain !important;
        -webkit-overflow-scrolling: touch !important;
        background: #000 !important;
        scrollbar-width: none !important;
      }

      .trend-app.mybrand-live-immersive .live-grid::-webkit-scrollbar {
        display: none !important;
      }

      .trend-app.mybrand-live-immersive .live-card,
      .trend-app.mybrand-live-immersive .trend-live-card {
        position: relative !important;
        flex: 0 0 100dvh !important;
        width: 100vw !important;
        height: 100dvh !important;
        min-height: 100dvh !important;
        max-height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        scroll-snap-align: start !important;
        scroll-snap-stop: always !important;
        overflow: hidden !important;
        background: #000 !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-video {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 100% !important;
        min-height: 100% !important;
        object-fit: cover !important;
        background: #000 !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-card:before {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        z-index: 2 !important;
        pointer-events: none !important;
        background: linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,.1) 55%, rgba(0,0,0,.76) 100%) !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-overlay {
        position: absolute !important;
        inset: 0 !important;
        z-index: 5 !important;
        padding: 76px 16px calc(24px + env(safe-area-inset-bottom)) !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        pointer-events: none !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-top {
        align-self: flex-start !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-live {
        font-size: 12px !important;
        padding: 7px 11px !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-bottom {
        align-items: flex-end !important;
        justify-content: flex-start !important;
        padding-bottom: 8px !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-copy {
        max-width: min(80vw, 430px) !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-copy .title {
        font-size: 18px !important;
        line-height: 1.35 !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-copy .desc {
        font-size: 12px !important;
        line-height: 1.6 !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-status {
        z-index: 7 !important;
        font-size: 13px !important;
        background: rgba(0,0,0,.34) !important;
      }

      .trend-app.mybrand-live-immersive .trend-live-card[data-live-connected="true"] .trend-live-status {
        display: none !important;
      }

      @media (min-width: 601px) {
        .trend-app.mybrand-live-immersive {
          width: 100vw !important;
          max-width: none !important;
        }
        .trend-app.mybrand-live-immersive .live-card,
        .trend-app.mybrand-live-immersive .trend-live-card {
          width: 100vw !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const syncMode = () => {
    const app = document.querySelector('.trend-app');
    const liveGrid = document.querySelector(LIVE_GRID);
    if (!app) return;
    app.classList.toggle('mybrand-live-immersive', Boolean(liveGrid));
    if (!liveGrid) return;

    const cards = [...liveGrid.querySelectorAll('.live-card, .trend-live-card')];
    cards.forEach((card) => {
      card.addEventListener('click', (event) => {
        if (card.classList.contains('trend-live-card')) event.preventDefault();
      }, { passive: false });
    });

    const activeCard = cards.find((card) => card.classList.contains('trend-live-card'));
    if (activeCard && activeCard.dataset.liveImmersiveReady !== '1') {
      activeCard.dataset.liveImmersiveReady = '1';
      activeCard.scrollIntoView({ block: 'start' });
    }
  };

  injectStyles();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(syncMode);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('popstate', () => setTimeout(syncMode, 0));
  document.addEventListener('click', () => setTimeout(syncMode, 0), true);
  window.addEventListener('resize', syncMode, { passive: true });
  syncMode();
})();
