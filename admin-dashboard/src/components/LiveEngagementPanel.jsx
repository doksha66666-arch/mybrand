import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function LiveEngagementPanel() {
  const [stream, setStream] = useState(null);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const load = async () => {
      try {
        const { data } = await api.get('/live/mine');
        if (cancelled) return;
        const current = data?.active && data?.stream ? data.stream : null;
        setStream(current);
        if (!current?.id) {
          setLikes(0);
          setComments([]);
          return;
        }
        const state = await api.get(`/live/${current.id}/state`);
        if (cancelled) return;
        setLikes(Number(state.data?.stream?.likes || current.likes || 0));
        setComments(Array.isArray(state.data?.comments) ? state.data.comments.slice(-20).reverse() : []);
      } catch {
        if (!cancelled) {
          setStream(null);
          setLikes(0);
          setComments([]);
        }
      } finally {
        if (!cancelled) timer = window.setTimeout(load, 2000);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <section style={{ marginTop: 18, background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 12px 35px rgba(15,23,42,.08)', border: '1px solid #E2E8F0' }} dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>💬 تفاعل المشاهدين</h3>
          <p style={{ margin: '5px 0 0', fontSize: 11, color: '#64748B' }}>{stream ? 'التفاعل يظهر هنا أثناء البث مباشرة.' : 'سيظهر التفاعل عند بدء البث.'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '8px 11px', borderRadius: 12, background: '#FFF1F2', color: '#BE123C', fontWeight: 900, fontSize: 12 }}>❤️ {likes.toLocaleString('ar-EG')}</div>
          <div style={{ padding: '8px 11px', borderRadius: 12, background: '#F1F5F9', color: '#334155', fontWeight: 900, fontSize: 12 }}>💬 {comments.length.toLocaleString('ar-EG')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
        {comments.length ? comments.map((item, index) => (
          <div key={item.id || `${item.createdAt || ''}-${index}`} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '9px 10px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#E2E8F0', color: '#334155', fontWeight: 900, flexShrink: 0 }}>{(item.name || 'ع').charAt(0)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#0F172A' }}>{item.name || 'عميل MYBRAND'}</div>
              <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.6, color: '#475569', wordBreak: 'break-word' }}>{item.text || item.comment || ''}</div>
            </div>
          </div>
        )) : (
          <div style={{ padding: 18, textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: 12 }}>لا توجد تعليقات بعد.</div>
        )}
      </div>
    </section>
  );
}
