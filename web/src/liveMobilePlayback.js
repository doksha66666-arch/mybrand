(() => {
  if (typeof window === 'undefined' || window.__MYBRAND_LIVE_MOBILE_PLAYBACK__) return;
  window.__MYBRAND_LIVE_MOBILE_PLAYBACK__ = true;

  const unlockAudio = () => {
    document.querySelectorAll('.trend-live-video').forEach((video) => {
      if (!video.srcObject) return;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      video.play().catch(() => {});
    });
  };

  const prepareVideos = () => {
    document.querySelectorAll('.trend-live-video').forEach((video) => {
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      if (video.srcObject && video.paused) {
        // Mobile browsers may reject autoplay with audio. Start playback muted,
        // then unlock audio on the first natural user gesture without a sound button.
        video.muted = true;
        video.defaultMuted = true;
        video.play().catch(() => {});
      }
    });
  };

  const observer = new MutationObserver(prepareVideos);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  ['touchstart', 'pointerdown', 'click'].forEach((eventName) => {
    document.addEventListener(eventName, unlockAudio, { passive: true, capture: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) prepareVideos();
  });
  prepareVideos();
})();
