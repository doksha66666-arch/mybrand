import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const EMPTY_FORM = { title: '', description: '' };

export default function MerchantLiveStudioPage() {
  const [active, setActive] = useState(null);
  const [library, setLibrary] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [mineRes, libraryRes] = await Promise.all([
        api.get('/live/mine'),
        api.get('/live/library'),
      ]);
      setActive(mineRes.data?.stream || null);
      setLibrary(libraryRes.data?.videos || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل غرفة العروض المباشرة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedLabel = useMemo(() => {
    if (!file) return 'اختر فيديو MP4 أو WebM أو MOV';
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    return `${file.name} · ${sizeMb} MB`;
  }, [file]);

  const uploadToCloudinary = async () => {
    if (!file) throw new Error('اختر فيديو أولًا.');
    const { data: signature } = await api.get('/upload/video/signature');
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', signature.apiKey);
    body.append('timestamp', String(signature.timestamp));
    body.append('folder', signature.folder);
    body.append('signature', signature.signature);

    const response = await fetch(signature.uploadUrl, { method: 'POST', body });
    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      throw new Error(data?.error?.message || 'تعذر رفع الفيديو إلى التخزين.');
    }
    return { url: data.secure_url, publicId: data.public_id };
  };

  const publish = async (event) => {
    event.preventDefault();
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const title = form.title.trim();
      const description = form.description.trim();
      if (!title) throw new Error('عنوان العرض مطلوب.');
      const uploaded = await uploadToCloudinary();
      await api.post('/live/start-upload', {
        title,
        description,
        videoUrl: uploaded.url,
        videoPublicId: uploaded.publicId,
      });
      setFile(null);
      setForm(EMPTY_FORM);
      setMessage('تم نشر العرض الآن. سيظهر للعملاء كعرض مباشر.');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر نشر العرض.');
    } finally {
      setUploading(false);
    }
  };

  const stop = async () => {
    if (!active?.id) return;
    setActionId(active.id);
    setError('');
    setMessage('');
    try {
      await api.post(`/live/${active.id}/stop`);
      setMessage('تم إنهاء العرض وحفظه في المكتبة.');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إنهاء العرض.');
    } finally {
      setActionId('');
    }
  };

  const replay = async (videoId) => {
    setActionId(videoId);
    setError('');
    setMessage('');
    try {
      await api.post(`/live/${videoId}/replay`);
      setMessage('تم تشغيل العرض المحفوظ من جديد.');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إعادة تشغيل العرض.');
    } finally {
      setActionId('');
    }
  };

  const remove = async (videoId) => {
    if (!window.confirm('حذف العرض المحفوظ نهائيًا؟')) return;
    setActionId(videoId);
    setError('');
    setMessage('');
    try {
      await api.delete(`/live/${videoId}/library`);
      setMessage('تم حذف العرض المحفوظ.');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حذف العرض المحفوظ.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="mls" dir="rtl">
      <style>{css}</style>
      <header className="mls-hero">
        <div>
          <div className="mls-kicker">MYBRAND · LIVE PRESENTATION</div>
          <h1>غرفة العروض المباشرة</h1>
          <p>ارفع فيديو جاهزًا، انشره كعرض مباشر للمتجر، ثم أوقفه أو أعد تشغيله من المكتبة.</p>
        </div>
        <span className={active ? 'mls-status live' : 'mls-status'}>{active ? '● مباشر الآن' : 'جاهز للنشر'}</span>
      </header>

      {message && <div className="mls-alert success">{message}</div>}
      {error && <div className="mls-alert error">{error}</div>}

      {loading ? (
        <section className="mls-card mls-empty">جارٍ تحميل غرفة العروض…</section>
      ) : (
        <div className="mls-grid">
          <section className="mls-card">
            <h2>نشر عرض جديد</h2>
            {active ? (
              <div className="mls-active">
                <video controls playsInline src={active.videoUrl} />
                <div className="mls-active-copy">
                  <span>العرض الحالي</span>
                  <h3>{active.title}</h3>
                  {active.description && <p>{active.description}</p>}
                  <div className="mls-stats">
                    <b>👥 {active.viewerCount || 0} مشاهد</b>
                    <b>♥ {active.likes || 0} إعجاب</b>
                  </div>
                  <button className="danger" disabled={actionId === active.id} onClick={stop}>
                    {actionId === active.id ? 'جارٍ الإيقاف…' : 'إنهاء العرض'}
                  </button>
                </div>
              </div>
            ) : (
              <form className="mls-form" onSubmit={publish}>
                <label>
                  عنوان العرض
                  <input
                    maxLength={120}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: عرض نهاية الأسبوع"
                  />
                </label>
                <label>
                  وصف العرض
                  <textarea
                    maxLength={500}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="اكتب وصفًا قصيرًا يظهر للمشاهدين."
                  />
                </label>
                <label className="mls-upload">
                  <span>فيديو العرض</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  <strong>{selectedLabel}</strong>
                  <small>يتم رفع الملف مباشرة إلى التخزين ثم نشر رابطه بأمان داخل العرض.</small>
                </label>
                <button className="primary" disabled={uploading || !file}>
                  {uploading ? 'جارٍ رفع الفيديو ونشر العرض…' : 'رفع الفيديو ونشره الآن'}
                </button>
              </form>
            )}
          </section>

          <section className="mls-card">
            <div className="mls-list-head">
              <div>
                <h2>مكتبة العروض</h2>
                <p>{library.length} عرض محفوظ</p>
              </div>
              <button className="secondary" onClick={load}>تحديث</button>
            </div>
            <div className="mls-list">
              {library.length ? library.map((item) => (
                <article className="mls-item" key={item.id}>
                  <video controls preload="metadata" src={item.videoUrl} />
                  <div className="mls-item-copy">
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    <small>{item.endedAt ? new Date(item.endedAt).toLocaleString('ar-EG') : 'محفوظ'}</small>
                    <div className="mls-actions">
                      <button className="primary small" disabled={Boolean(actionId)} onClick={() => replay(item.id)}>
                        إعادة التشغيل
                      </button>
                      <button className="secondary small" disabled={Boolean(actionId)} onClick={() => remove(item.id)}>
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="mls-empty">لا توجد عروض محفوظة بعد.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const css = `
.mls{max-width:1400px;margin:0 auto;padding:28px;color:#171717}.mls-hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:24px}.mls-kicker{font-size:12px;font-weight:800;letter-spacing:.14em;opacity:.58}.mls h1{margin:6px 0;font-size:34px}.mls-hero p{margin:0;max-width:760px;color:#666}.mls-status{padding:9px 14px;border:1px solid #ddd;border-radius:999px;font-size:13px;font-weight:800;white-space:nowrap}.mls-status.live{border-color:#222;background:#111;color:#fff}.mls-alert{padding:12px 16px;border-radius:14px;margin-bottom:16px;font-weight:700}.mls-alert.success{background:#edf8f0}.mls-alert.error{background:#fff0f0}.mls-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:20px}.mls-card{background:#fff;border:1px solid #e9e9e9;border-radius:22px;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,.05)}.mls-card h2{margin:0 0 18px;font-size:20px}.mls-form{display:grid;gap:15px}.mls-form label{display:grid;gap:7px;font-weight:800;font-size:14px}.mls-form input,.mls-form textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:12px;padding:12px 13px;font:inherit;background:#fff}.mls-form textarea{min-height:110px;resize:vertical}.mls-upload{padding:16px;border:1px dashed #bbb;border-radius:16px;background:#fafafa}.mls-upload input{padding:0;border:0}.mls-upload strong{font-size:13px;word-break:break-word}.mls-upload small{font-weight:500;color:#777}.mls button{border:0;border-radius:12px;padding:11px 15px;font:inherit;font-weight:800;cursor:pointer}.mls button:disabled{opacity:.55;cursor:not-allowed}.mls .primary{background:#111;color:#fff}.mls .secondary{background:#f1f1f1;color:#111}.mls .danger{background:#8d1d1d;color:#fff}.mls .small{padding:8px 11px;font-size:13px}.mls-active{display:grid;gap:16px}.mls-active video{width:100%;max-height:520px;background:#000;border-radius:16px}.mls-active-copy h3,.mls-item h3{margin:4px 0 6px}.mls-active-copy p,.mls-item-copy p{margin:0 0 9px;color:#666}.mls-active-copy span{font-size:12px;font-weight:800;opacity:.55}.mls-stats{display:flex;gap:15px;flex-wrap:wrap;margin:14px 0}.mls-list-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px}.mls-list-head h2{margin:0}.mls-list-head p{margin:3px 0 0;color:#777;font-size:13px}.mls-list{display:grid;gap:12px;max-height:650px;overflow:auto;padding-right:2px}.mls-item{display:grid;grid-template-columns:180px minmax(0,1fr);gap:13px;padding:12px;border:1px solid #eee;border-radius:16px}.mls-item video{width:180px;height:112px;object-fit:cover;background:#000;border-radius:12px}.mls-item-copy small{color:#888}.mls-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.mls-empty{text-align:center;padding:34px;color:#777}.mls@media(max-width:900px){.mls-grid{grid-template-columns:1fr}.mls-hero{flex-direction:column}.mls-item{grid-template-columns:1fr}.mls-item video{width:100%;height:auto;max-height:280px}}
`;