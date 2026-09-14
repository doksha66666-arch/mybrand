// Mobile browsers commonly block autoplay when a MediaStream has an active audio track.
// Let the live video start muted, then preserve normal user-controlled audio afterward.
(() => {
  if (typeof window === 'undefined' || !window.HTMLMediaElement) return;
  const proto = window.HTMLMediaElement.prototype;
  const originalPlay = proto.play;
  if (typeof originalPlay !== 'function' || proto.__mybrandLiveAutoplayPatched) return;

  Object.defineProperty(proto, '__mybrandLiveAutoplayPatched', { value: true });

  proto.play = function patchedPlay(...args) {
    const isLiveViewer = this instanceof HTMLVideoElement
      && this.controls
      && this.srcObject instanceof MediaStream;

    if (isLiveViewer && !this.dataset.mybrandLiveStarted) {
      this.muted = true;
      this.defaultMuted = true;
      this.dataset.mybrandLiveStarted = '1';
    }

    return originalPlay.apply(this, args);
  };
})();
