import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client';

export default function TrendLiveCard({ stream }) {
  const videoRef = useRef(null);
  const viewerIdRef = useRef('');
  const viewerKeyRef = useRef('');
  const [viewerCount, setViewerCount] = useState(Number(stream?.viewerCount || 0));
  const [videoRatio, setVideoRatio] = useState(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let heartbeat;
    const key = (() => {
      try {
        const stored = localStorage.getItem('mybrand-live-viewer-key');
        if (stored) return stored;
        const value = `viewer_${crypto.randomUUID?.() || Date.now()}`;
        localStorage.setItem('mybrand-live-viewer-key', value);
        return value;
      } catch { return `viewer_${Date.now()}`; }
    })();
    viewerKeyRef.current = key;

    const join = async () => {
      if (!stream?.id || cancelled) return false;
      try {
        const { data } = await api.post(`/live/${stream.id}/join`, { viewerKey: key });
        if (cancelled) return false;
        viewerIdRef.current = data.viewerId || '';
        setViewerCount(data.viewerCount || stream.viewerCount || 0);
        return Boolean(viewerIdRef.current);
      } catch {
        viewerIdRef.current = '';
        return false;
      }
    };

    const sendHeartbeat = async () => {
      if (cancelled || !stream?.id) return;
      if (!viewerIdRef.current) {
        await join();
        return;
      }
      try {
        const r = await api.post(`/live/${stream.id}/heartbeat/${viewerIdRef.current}`);
        if (!cancelled) setViewerCount(r.data.viewerCount || 0);
      } catch (error) {
        // Viewer sessions live in server memory. If the API restarts or the
        // session expires, the old viewerId becomes invalid. Re-join once so
        // the client recovers automatically instead of polling a permanent 404.
        if (error?.response?.status === 404 && !cancelled) {
          viewerIdRef.current = '';
          await join();
        }
      }
    };

    join().then(() => {
      if (!cancelled) heartbeat = setInterval(sendHeartbeat, 15000);
    });

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      if (viewerIdRef.current) api.delete(`/live/${stream?.id}/viewer/${viewerIdRef.current}`).catch(() => {});
      viewerIdRef.current = '';
    };
  }, [stream?.id, stream?.viewerCount]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream?.videoUrl) return;

    const setNaturalRatio = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoRatio(video.videoWidth / video.videoHeight);
      }
    };

    video.muted = muted;
    video.defaultMuted = muted;
    video.controls = false;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;

    const startWithSound = () => {
      video.muted = muted;
      video.defaultMuted = muted;
      video.volume = 1;
      video.play().catch(() => {});
    };

    const onUserGesture = () => startWithSound();

    setNaturalRatio();
    video.addEventListener('loadedmetadata', setNaturalRatio);
    video.addEventListener('canplay', startWithSound, { once: true });
    document.addEventListener('pointerdown', onUserGesture, { passive: true });
    document.addEventListener('keydown', onUserGesture, { passive: true });
    document.addEventListener('touchstart', onUserGesture, { passive: true });

    return () => {
      video.removeEventListener('loadedmetadata', setNaturalRatio);
      video.removeEventListener('canplay', startWithSound);
      document.removeEventListener('pointerdown', onUserGesture);
      document.removeEventListener('keydown', onUserGesture);
      document.removeEventListener('touchstart', onUserGesture);
    };
  }, [stream?.videoUrl, muted]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    video.defaultMuted = nextMuted;
    video.volume = 1;
    setMuted(nextMuted);
    if (!nextMuted) video.play().catch(() => {});
  };

  const keepPlaying = (video) => {
    if (!video) return;
    if (video.paused || video.ended) {
      video.muted = muted;
      video.currentTime = video.ended ? 0 : video.currentTime;
      video.play().catch(() => {});
    }
  };

  const articleStyle = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: 'auto',
    aspectRatio: videoRatio ? `${videoRatio} / 1` : '16 / 9',
    maxHeight: 'calc(100vh - 24px)',
    background: '#000',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    pointerEvents: 'none',
  };

  return (
    <article
      className="trend-live-card trend-live-card-clean"
      data-stream-id={stream?.id || ''}
      aria-label="عرض MYBRAND"
      style={articleStyle}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {stream?.videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={stream.videoUrl}
            className="trend-live-video trend-live-video-clean"
            autoPlay
            playsInline
            loop
            preload="auto"
            controls={false}
            controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
            disablePictureInPicture
            disableRemotePlayback
            draggable={false}
            tabIndex={-1}
            aria-hidden="true"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              minWidth: '100%',
              minHeight: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              background: '#000',
              pointerEvents: 'none',
            }}
            onPause={(e) => keepPlaying(e.currentTarget)}
            onEnded={(e) => keepPlaying(e.currentTarget)}
            onContextMenu={(e) => e.preventDefault()}
          />
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 10,
              width: 42,
              height: 42,
              padding: 0,
              border: '1px solid rgba(255,255,255,.28)',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(0,0,0,.48)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {muted ? <><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m19 9-6 6"/><path d="m13 9 6 6"/></> : <><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></>}
            </svg>
          </button>
        </>
      ) : null}
    </article>
  );
}
