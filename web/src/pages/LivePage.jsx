import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStoreLayout } from '../context/StoreLayoutContext';

const getViewerKey = () => {
  try {
    const current = localStorage.getItem('mybrand-live-viewer-key');
    if (current) return current;
    const key = `viewer_${crypto.randomUUID?.() || Date.now()}`;
    localStorage.setItem('mybrand-live-viewer-key', key);
    return key;
  } catch { return `viewer_${Date.now()}`; }
};

export default function LivePage() {
  const { id: routeStreamId } = useParams();
  const { user, loading } = useAuth();
  const { getStyle } = useStoreLayout('live');
  const broadcaster = user?.role === 'merchant' || user?.role === 'admin';
  const [activeIndex, setActiveIndex] = useState(0);
  const [active, setActive] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const viewerIdRef = useRef(null);
  const viewerKeyRef = useRef(getViewerKey());
  const heartbeatRef = useRef(null);

  const loadStreams = useCallback(async () => {
    try {
      const { data } = await api.get('/live/active');
      const next = Array.isArray(data?.streams) ? data.streams : (data?.stream ? [data.stream] : []);
      const selected = routeStreamId ? next.find((s) => String(s.id) === String(routeStreamId)) : next[Math.min(activeIndex, Math.max(0, next.length - 1))];
      setActive(selected || null);
      setViewerCount(selected?.viewerCount || 0);
      if (selected?.id) {
        try { const state = await api.get(`/live/${selected.id}/state`); setComments(state.data?.comments || []); } catch {}
      }
    } catch { setError('تعذر الاتصال بخدمة العروض.'); }
  }, [activeIndex, routeStreamId]);

  useEffect(() => {
    if (broadcaster) return undefined;
    loadStreams();
    const timer = setInterval(loadStreams, 5000);
    return () => clearInterval(timer);
  }, [broadcaster, loadStreams]);

  useEffect(() => {
    if (broadcaster || !active?.id) return undefined;
    let cancelled = false;
    const stopHeartbeat = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    };
    const join = async () => {
      try {
        const { data } = await api.post(`/live/${active.id}/join`, { viewerKey: viewerKeyRef.current });
        if (cancelled) return;
        viewerIdRef.current = data.viewerId;
        setViewerCount(data.viewerCount || active.viewerCount || 0);
        stopHeartbeat();
        heartbeatRef.current = setInterval(async () => {
          if (!viewerIdRef.current || cancelled) return;
          try {
            const r = await api.post(`/live/${active.id}/heartbeat/${viewerIdRef.current}`);
            if (!cancelled) setViewerCount(r.data.viewerCount || 0);
          } catch (e) {
            const status = e?.response?.status;
            if (status === 404 || status === 410) {
              stopHeartbeat();
              viewerIdRef.current = null;
              if (!cancelled) {
                await join();
              }
            }
          }
        }, 15000);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'تعذر فتح العرض.');
      }
    };
    join();
    return () => {
      cancelled = true;
      stopHeartbeat();
      if (viewerIdRef.current) api.delete(`/live/${active.id}/viewer/${viewerIdRef.current}`).catch(() => {});
      viewerIdRef.current = null;
    };
  }, [active?.id, broadcaster, loadStreams]);

  const sendComment = async (e) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text || !active?.id) return;
    setComment('');
    try { const { data } = await api.post(`/live/${active.id}/comments`, { text, name: user?.name || 'عميل MYBRAND', viewerId: viewerIdRef.current }); setComments(data.comments || []); } catch {}
  };

  const like = async () => {
    if (!active?.id) return;
    try {
      const liked = !active.__liked;
      const { data } = await api.post(`/live/${active.id}/like`, { viewerKey: viewerKeyRef.current, liked });
      setActive((current) => current ? { ...current, likes: data.likes, __liked: liked } : current);
    } catch {}
  };

  if (loading) return <div className="live-loading">جارٍ تجهيز العرض...</div>;
  if (broadcaster) return <div className="live-loading" dir="rtl">إدارة العروض تتم من لوحة المذيع: ارفع الفيديو ثم انشره للمشاهدين.</div>;

  return <div className="mybrand-live" dir="rtl">
    <section className="viewer-reels">
      <div className="viewer-reels-stage" style={getStyle('stage')}>
        {active?.videoUrl ? <>
          <video src={active.videoUrl} className="viewer-video" controls playsInline preload="metadata" autoPlay muted onEnded={loadStreams} />
          <div className="viewer-top"><b>🔴 عرض الآن</b><span>👁 {viewerCount}</span></div>
          <div className="viewer-bottom"><strong>{active.title}</strong><span>{active.description}</span><div className="viewer-actions"><button type="button" onClick={like}>❤️ {active.likes || 0}</button></div></div>
        </> : <div className="empty"><b>لا يوجد عرض الآن</b><span>عندما ينشر المذيع فيديو جديد سيظهر هنا تلقائيًا.</span></div>}
      </div>
      {error && <div className="viewer-status">{error}</div>}
      {active && <form className="live-comments" style={getStyle('comments')} onSubmit={sendComment}><div>{comments.slice(-5).map((item) => <p key={item.id}><b>{item.name}</b> {item.text}</p>)}</div><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب تعليقك..." /><button type="submit">إرسال</button></form>}
    </section>
  </div>;
}
