import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const uploadDirectToCloudinary = async (file, setProgress) => {
  const { data: signed } = await api.get('/upload/video/signature');
  if (!signed?.uploadUrl || !signed?.signature || !signed?.apiKey || !signed?.timestamp) {
    throw new Error('تعذر تجهيز رفع الفيديو.');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('folder', signed.folder);
  form.append('signature', signed.signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', signed.uploadUrl, true);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof setProgress === 'function') {
        setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      let payload = null;
      try { payload = JSON.parse(xhr.responseText || '{}'); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && payload?.secure_url) {
        if (typeof setProgress === 'function') setProgress(100);
        resolve(payload);
      } else {
        reject(new Error(payload?.error?.message || 'فشل رفع الفيديو إلى التخزين.'));
      }
    };
    xhr.onerror = () => reject(new Error('انقطع الاتصال أثناء رفع الفيديو.'));
    xhr.onabort = () => reject(new Error('تم إلغاء رفع الفيديو.'));
    xhr.send(form);
  });
};

const formatDate = (value) => {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

export default function LivePage() {
  const [title, setTitle] = useState('عرض MYBRAND');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [active, setActive] = useState(null);
  const [savedVideos, setSavedVideos] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [libraryBusy, setLibraryBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refreshMine = useCallback(async () => {
    try {
      const { data } = await api.get('/live/mine');
      if (data?.active && data?.stream) {
        setActive(data.stream);
        setViewerCount(data.stream.viewerCount || 0);
        setTitle(data.stream.title || 'عرض MYBRAND');
        setDescription(data.stream.description || '');
      } else {
        setActive(null);
        setViewerCount(0);
      }
    } catch {}
  }, []);

  const refreshLibrary = useCallback(async () => {
    try {
      const { data } = await api.get('/live/library');
      setSavedVideos(Array.isArray(data?.videos) ? data.videos : []);
    } catch {
      setSavedVideos([]);
    }
  }, []);

  useEffect(() => {
    refreshMine();
    refreshLibrary();
    const timer = setInterval(() => {
      refreshMine();
      refreshLibrary();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshMine, refreshLibrary]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const chooseVideo = (next) => {
    setError('');
    setMessage('');
    setProgress(0);
    if (!next) return;
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(next.type)) {
      setError('يسمح فقط بملفات MP4 أو WEBM أو MOV.');
      return;
    }
    if (next.size > 100 * 1024 * 1024) {
      setError('الحد الأقصى لحجم الفيديو 100 ميجابايت.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const publishVideo = async () => {
    if (!file || active || busy) return;
    setBusy(true);
    setProgress(0);
    setError('');
    setMessage('جاري رفع الفيديو مباشرة إلى التخزين السريع…');
    try {
      const uploaded = await uploadDirectToCloudinary(file, setProgress);
      const videoUrl = uploaded.secure_url;
      const { data } = await api.post('/live/start-upload', {
        title,
        description,
        videoUrl,
        videoPublicId: uploaded.public_id || '',
      });
      setActive(data.stream);
      setViewerCount(0);
      setMessage('تم نشر الفيديو للمشاهدين الآن. وبعد إنهاء العرض سيظهر تلقائيًا في مكتبة الفيديو المحفوظة.');
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview('');
      await refreshLibrary();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر رفع الفيديو.');
      setMessage('');
    } finally {
      setBusy(false);
    }
  };

  const stopPresentation = async () => {
    if (!active?.id || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/live/${active.id}/stop`);
      setMessage('تم إنهاء العرض وحفظ الفيديو في المكتبة لاستخدامه مرة أخرى.');
      setActive(null);
      setViewerCount(0);
      await refreshLibrary();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إنهاء العرض.');
    } finally {
      setBusy(false);
    }
  };

  const replaySaved = async (video) => {
    if (!video?.id || active || libraryBusy || busy) return;
    setLibraryBusy(video.id);
    setError('');
    setMessage('جاري إعادة تشغيل العرض المحفوظ…');
    try {
      const { data } = await api.post(`/live/${video.id}/replay`);
      setActive(data.stream);
      setTitle(data.stream?.title || 'عرض MYBRAND');
      setDescription(data.stream?.description || '');
      setViewerCount(0);
      await refreshLibrary();
      setMessage('تم بدء العرض المحفوظ مرة أخرى.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إعادة تشغيل الفيديو المحفوظ.');
      setMessage('');
    } finally {
      setLibraryBusy('');
    }
  };

  const deleteSaved = async (video) => {
    if (!video?.id || active || libraryBusy || busy) return;
    const confirmed = window.confirm(`هل تريد حذف الفيديو «${video.title || 'عرض MYBRAND'}» نهائيًا؟`);
    if (!confirmed) return;
    setLibraryBusy(video.id);
    setError('');
    setMessage('جاري حذف الفيديو المحفوظ…');
    try {
      await api.delete(`/live/${video.id}/library`);
      setSavedVideos((current) => current.filter((item) => item.id !== video.id));
      setMessage('تم حذف الفيديو المحفوظ.');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حذف الفيديو المحفوظ.');
      setMessage('');
    } finally {
      setLibraryBusy('');
    }
  };

  return (
    <div dir="rtl" style={styles.page}>
      <header style={styles.header}>
        <div>
          <span style={styles.eyebrow}>MYBRAND MEDIA</span>
          <h1 style={styles.title}>استوديو عرض الفيديو</h1>
          <p style={styles.subtitle}>ارفع فيديو جاهز وانشره للمشاهدين مباشرة بدون OBS أو كاميرا أو ميكروفون.</p>
        </div>
        <div style={{ ...styles.status, ...(active ? styles.statusLive : styles.statusIdle) }}>
          {active ? '● منشور الآن' : 'جاهز لرفع فيديو'}
        </div>
      </header>

      {(error || message) && (
        <div style={{ ...styles.notice, ...(error ? styles.noticeError : styles.noticeSuccess) }}>
          {error || message}
        </div>
      )}

      <div style={styles.grid}>
        <section style={styles.videoCard}>
          <div style={styles.videoBox}>
            {preview || active?.videoUrl ? (
              <video src={active?.videoUrl || preview} controls playsInline preload="metadata" style={styles.video} />
            ) : (
              <div style={styles.empty}>
                <div style={{ fontSize: 58 }}>🎬</div>
                <strong>ارفع فيديو العرض</strong>
                <span>سيظهر هنا قبل النشر، وبعد النشر سيشاهده العملاء من صفحة العروض.</span>
              </div>
            )}
          </div>
          {active && (
            <div style={styles.liveRow}>
              <div>
                <b>{active.title}</b>
                <small style={styles.viewers}>👁 {viewerCount} مشاهد</small>
              </div>
              <button onClick={stopPresentation} disabled={busy} style={styles.stop}>{busy ? 'جاري الإيقاف…' : 'إنهاء العرض'}</button>
            </div>
          )}
        </section>

        <aside style={styles.panel}>
          <h2 style={styles.panelTitle}>بيانات العرض</h2>
          <label style={styles.label}>عنوان العرض</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy || Boolean(active)} maxLength={120} style={styles.input} />
          <label style={styles.label}>الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy || Boolean(active)} maxLength={500} style={styles.textarea} />

          {!active && (
            <>
              <label htmlFor="admin-live-video" style={styles.drop}>
                <div style={{ fontSize: 34 }}>📤</div>
                <b>{file ? file.name : 'اختيار فيديو من الجهاز'}</b>
                <small>MP4 / WEBM / MOV — حتى 100MB</small>
              </label>
              <input id="admin-live-video" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => chooseVideo(e.target.files?.[0] || null)} style={{ display: 'none' }} disabled={busy} />
              {busy && (
                <div style={styles.progressWrap} aria-live="polite">
                  <div style={styles.progressTrack}><div style={{ ...styles.progressBar, width: `${progress}%` }} /></div>
                  <small style={styles.progressText}>{progress}% — {progress < 100 ? 'جاري الرفع…' : 'اكتمل الرفع، جاري النشر…'}</small>
                </div>
              )}
              <button onClick={publishVideo} disabled={!file || busy} style={{ ...styles.publish, opacity: !file || busy ? 0.55 : 1 }}>
                {busy ? 'جاري الرفع والنشر…' : '📺 نشر الفيديو'}
              </button>
            </>
          )}
        </aside>
      </div>

      <section style={styles.librarySection} aria-labelledby="saved-presentations-title">
        <div style={styles.libraryHeader}>
          <div>
            <span style={styles.eyebrow}>VIDEO LIBRARY</span>
            <h2 id="saved-presentations-title" style={styles.libraryTitle}>الفيديوهات المحفوظة</h2>
            <p style={styles.librarySubtitle}>عند إنهاء أي عرض، يظل الفيديو محفوظًا هنا ويمكنك بدء عرضه مرة أخرى أو حذفه نهائيًا.</p>
          </div>
          <div style={styles.countBadge}>{savedVideos.length} فيديو</div>
        </div>

        {savedVideos.length === 0 ? (
          <div style={styles.libraryEmpty}>
            <div style={styles.libraryEmptyIcon}>▣</div>
            <strong>لا توجد فيديوهات محفوظة حتى الآن</strong>
            <span>أنهِن أي عرض وسيظهر الفيديو هنا تلقائيًا.</span>
          </div>
        ) : (
          <div style={styles.libraryGrid}>
            {savedVideos.map((video) => {
              const itemBusy = libraryBusy === video.id;
              return (
                <article key={video.id} style={styles.savedCard}>
                  <div style={styles.savedPreviewWrap}>
                    <video
                      src={video.videoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      controls={false}
                      style={styles.savedPreview}
                      aria-label={`معاينة ${video.title || 'الفيديو المحفوظ'}`}
                    />
                    <div style={styles.savedStatus}>محفوظ</div>
                  </div>
                  <div style={styles.savedBody}>
                    <h3 style={styles.savedTitle}>{video.title || 'عرض MYBRAND'}</h3>
                    {video.description ? <p style={styles.savedDescription}>{video.description}</p> : null}
                    <small style={styles.savedDate}>آخر إنهاء: {formatDate(video.endedAt || video.createdAt)}</small>
                    <div style={styles.savedActions}>
                      <button
                        type="button"
                        onClick={() => replaySaved(video)}
                        disabled={Boolean(active) || busy || Boolean(libraryBusy)}
                        style={{ ...styles.replay, opacity: itemBusy || active || busy ? 0.55 : 1 }}
                      >
                        {itemBusy ? 'جاري التنفيذ…' : 'ابدأ العرض'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSaved(video)}
                        disabled={Boolean(active) || busy || Boolean(libraryBusy)}
                        style={{ ...styles.deleteSaved, opacity: itemBusy || active || busy ? 0.55 : 1 }}
                      >
                        {itemBusy ? 'جاري التنفيذ…' : 'حذف'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '28px 0 50px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 20 },
  eyebrow: { fontSize: 12, fontWeight: 900, letterSpacing: 1, color: '#E60023' },
  title: { margin: '6px 0', fontSize: 30, color: '#0f172a' },
  subtitle: { margin: 0, color: '#64748b' },
  status: { padding: '10px 14px', borderRadius: 999, fontWeight: 900, whiteSpace: 'nowrap' },
  statusLive: { background: '#dcfce7', color: '#15803d' },
  statusIdle: { background: '#f1f5f9', color: '#475569' },
  notice: { padding: 13, borderRadius: 12, marginBottom: 18, fontWeight: 700 },
  noticeError: { background: '#fff1f2', color: '#be123c' },
  noticeSuccess: { background: '#f0fdf4', color: '#047857' },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(320px,.8fr)', gap: 20 },
  videoCard: { background: '#050816', borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(15,23,42,.12)' },
  videoBox: { minHeight: 440, display: 'grid', placeItems: 'center' },
  video: { width: '100%', aspectRatio: '16/9', objectFit: 'contain', display: 'block', background: '#050816' },
  empty: { color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 40, textAlign: 'center' },
  liveRow: { background: '#fff', padding: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  viewers: { display: 'block', marginTop: 5, color: '#64748b' },
  panel: { background: '#fff', border: '1px solid #e8edf3', borderRadius: 20, padding: 22, boxShadow: '0 12px 35px rgba(15,23,42,.06)' },
  panelTitle: { marginTop: 0 },
  label: { display: 'block', fontWeight: 800, color: '#334155', margin: '12px 0 7px' },
  input: { width: '100%', boxSizing: 'border-box', padding: 12, border: '1px solid #dbe2ea', borderRadius: 12 },
  textarea: { width: '100%', minHeight: 110, boxSizing: 'border-box', padding: 12, border: '1px solid #dbe2ea', borderRadius: 12, resize: 'vertical' },
  drop: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: 15, padding: 22, background: '#f8fafc', cursor: 'pointer', marginTop: 18 },
  progressWrap: { marginTop: 14 },
  progressTrack: { width: '100%', height: 9, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 999, background: '#E60023', transition: 'width .2s ease' },
  progressText: { display: 'block', marginTop: 7, textAlign: 'center', color: '#64748b', fontWeight: 700 },
  publish: { width: '100%', marginTop: 15, border: 0, borderRadius: 12, padding: 14, background: '#E60023', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  stop: { border: 0, borderRadius: 10, padding: '10px 14px', background: '#111827', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  librarySection: { marginTop: 28, background: '#fff', border: '1px solid #e8edf3', borderRadius: 22, padding: 24, boxShadow: '0 12px 35px rgba(15,23,42,.06)' },
  libraryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 18 },
  libraryTitle: { margin: '5px 0', fontSize: 24, color: '#0f172a' },
  librarySubtitle: { margin: 0, color: '#64748b' },
  countBadge: { padding: '8px 12px', borderRadius: 999, background: '#f1f5f9', color: '#334155', fontWeight: 900, whiteSpace: 'nowrap' },
  libraryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 },
  savedCard: { border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', background: '#fff' },
  savedPreviewWrap: { position: 'relative', aspectRatio: '16/9', background: '#050816', overflow: 'hidden' },
  savedPreview: { width: '100%', height: '100%', display: 'block', objectFit: 'cover', background: '#050816' },
  savedStatus: { position: 'absolute', top: 10, right: 10, padding: '5px 9px', borderRadius: 999, background: 'rgba(255,255,255,.94)', color: '#0f172a', fontSize: 11, fontWeight: 900 },
  savedBody: { padding: 15 },
  savedTitle: { margin: 0, color: '#0f172a', fontSize: 17, lineHeight: 1.35 },
  savedDescription: { margin: '7px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.6, minHeight: 40 },
  savedDate: { display: 'block', marginTop: 10, color: '#94a3b8', fontSize: 12 },
  savedActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 14 },
  replay: { border: 0, borderRadius: 11, padding: 11, background: '#E60023', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  deleteSaved: { border: '1px solid #fecaca', borderRadius: 11, padding: 11, background: '#fff1f2', color: '#be123c', fontWeight: 900, cursor: 'pointer' },
  libraryEmpty: { minHeight: 180, border: '1px dashed #cbd5e1', borderRadius: 16, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, color: '#64748b', textAlign: 'center' },
  libraryEmptyIcon: { width: 46, height: 46, borderRadius: 14, background: '#e2e8f0', display: 'grid', placeItems: 'center', color: '#475569', fontSize: 22, marginBottom: 4 },
};
