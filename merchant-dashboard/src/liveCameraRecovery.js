const RECOVERY_KEY = '__mybrandLiveRecoveryInstalled';

if (typeof window !== 'undefined' && !window[RECOVERY_KEY]) {
  window[RECOVERY_KEY] = true;
  let recovering = false;
  let recoveryPromise = null;

  const activeCameraVideo = () => [...document.querySelectorAll('video')].find((video) => {
    if (!video.muted) return false;
    const stream = video.srcObject;
    return stream?.getVideoTracks?.().some((track) => track.readyState === 'ended' || track.readyState === 'live');
  });

  const recover = async (endedTrack) => {
    if (recovering) return recoveryPromise;
    const video = activeCameraVideo();
    if (!video) return null;
    recovering = true;
    recoveryPromise = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const currentStream = video.srcObject;
      if (!currentStream) return null;
      try {
        const replacement = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' }, width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 360 }, frameRate: { ideal: 30, max: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        const newVideoTrack = replacement.getVideoTracks()[0];
        if (!newVideoTrack) throw new Error('No replacement camera track');
        newVideoTrack.contentHint = 'motion';

        const pcs = window.__MYBRAND_LIVE_PCS || new Set();
        for (const pc of pcs) {
          if (pc.connectionState === 'closed') continue;
          for (const sender of pc.getSenders()) {
            if (sender.track === endedTrack || (sender.track?.kind === 'video' && sender.track?.readyState === 'ended')) {
              try { await sender.replaceTrack(newVideoTrack); } catch (_) {}
            }
          }
        }

        currentStream.getTracks().filter((track) => track.readyState !== 'ended').forEach((track) => track.stop());
        video.srcObject = replacement;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        await video.play().catch(() => {});
        bindTrack(newVideoTrack);
        return replacement;
      } catch (_) {
        return null;
      }
    })().finally(() => {
      recovering = false;
      recoveryPromise = null;
    });
    return recoveryPromise;
  };

  const bindTrack = (track) => {
    if (!track || track.kind !== 'video' || track.__mybrandRecoveryBound) return;
    track.__mybrandRecoveryBound = true;
    track.addEventListener('ended', () => recover(track));
  };

  window.__MYBRAND_LIVE_PCS = new Set();
  const OriginalPC = window.RTCPeerConnection;
  if (OriginalPC) {
    window.RTCPeerConnection = function (...args) {
      const pc = new OriginalPC(...args);
      window.__MYBRAND_LIVE_PCS.add(pc);
      const originalAddTrack = pc.addTrack.bind(pc);
      pc.addTrack = (...args2) => {
        const sender = originalAddTrack(...args2);
        bindTrack(args2[0]);
        return sender;
      };
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'closed') window.__MYBRAND_LIVE_PCS.delete(pc);
      });
      return pc;
    };
    window.RTCPeerConnection.prototype = OriginalPC.prototype;
  }

  const observeVideos = () => {
    document.querySelectorAll('video').forEach((video) => {
      if (!video.muted) return;
      const stream = video.srcObject;
      stream?.getVideoTracks?.().forEach(bindTrack);
      const ended = stream?.getVideoTracks?.().find((track) => track.readyState === 'ended');
      if (ended) recover(ended);
    });
  };
  new MutationObserver(observeVideos).observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(observeVideos, 1500);
}