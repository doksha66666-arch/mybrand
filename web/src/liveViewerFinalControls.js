(() => {
  const removeForbiddenViewerControls = () => {
    document.querySelectorAll('.mybrand-live .viewer-top').forEach((el) => el.remove());
    document.querySelectorAll('.mybrand-live .viewer-actions').forEach((el) => el.remove());
    document.querySelectorAll('.mybrand-live .live-progress').forEach((el) => el.remove());
    document.querySelectorAll('.mybrand-live button').forEach((button) => {
      const label = button.getAttribute('aria-label') || '';
      const text = (button.textContent || '').trim();
      if (label === 'الصوت' || label === 'إعجاب' || text.includes('تشغيل الصوت')) button.remove();
    });
  };

  const ensurePurchase = () => {
    const root = document.querySelector('.mybrand-live .viewer-bottom');
    if (!root) return;
    if (root.querySelector('.viewer-buy-button')) return;
    const button = document.createElement('a');
    button.className = 'viewer-buy-button';
    // /products is not a registered storefront route; send shoppers to the real catalog.
    button.href = '/categories';
    button.setAttribute('aria-label', 'اشترِ الآن');
    button.textContent = '🛒 اشترِ الآن';
    root.insertBefore(button, root.querySelector('form') || null);
  };

  const forceAudiblePlayback = () => {
    document.querySelectorAll('.mybrand-live video.viewer-video').forEach((video) => {
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      video.play().catch(() => {});
    });
  };

  const sync = () => {
    removeForbiddenViewerControls();
    ensurePurchase();
    forceAudiblePlayback();
  };

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('loadedmetadata', sync, true);
  document.addEventListener('canplay', sync, true);
  sync();
})();
