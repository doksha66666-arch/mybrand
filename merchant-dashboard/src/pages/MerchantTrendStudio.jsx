import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import ImageUploader from '../components/ImageUploader';

const EMPTY_POST = {
  type: 'post',
  text: '',
  image: '',
  videoUrl: '',
  productId: '',
  isPublished: true,
};

const EMPTY_STORY = {
  mediaType: 'image',
  mediaUrl: '',
  caption: '',
  productId: '',
  durationHours: 24,
  isPublished: true,
};

export default function MerchantTrendStudio() {
  const [tab, setTab] = useState('content');
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [products, setProducts] = useState([]);
  const [post, setPost] = useState(EMPTY_POST);
  const [story, setStory] = useState(EMPTY_STORY);
  const [editPost, setEditPost] = useState(null);
  const [editStory, setEditStory] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [postRes, storyRes, productRes] = await Promise.all([
        api.get('/trend/merchant/posts'),
        api.get('/stories/merchant'),
        api.get('/products/mine'),
      ]);
      setPosts(postRes.data?.posts || []);
      setStories(storyRes.data?.stories || []);
      setProducts(productRes.data?.products || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل استديو الترند');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const merchantProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((item) => item.isActive !== false && ['approved', 'out_of_stock'].includes(item.status))
      .filter((item) => {
        const haystack = `${item.nameAr || ''} ${item.nameEn || ''} ${item.sku || ''}`.toLowerCase();
        return !q || haystack.includes(q);
      });
  }, [products, query]);

  const resetPost = () => {
    setPost({ ...EMPTY_POST });
    setEditPost(null);
    setQuery('');
  };

  const resetStory = () => {
    setStory({ ...EMPTY_STORY });
    setEditStory(null);
    setQuery('');
  };

  const upload = async (file, target) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const isVideo = file.type.startsWith('video/');
      const body = new FormData();
      body.append(isVideo ? 'video' : 'image', file);
      const endpoint = isVideo && target === 'reel'
        ? '/trend/video-upload'
        : isVideo
          ? '/upload/video'
          : '/upload';

      const { data } = await api.post(endpoint, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });

      if (!data?.url) throw new Error('لم يتم استلام رابط الملف');

      if (target === 'reel') {
        setPost((value) => ({ ...value, videoUrl: data.url }));
      } else {
        setStory((value) => ({
          ...value,
          mediaType: isVideo ? 'video' : 'image',
          mediaUrl: data.url,
        }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const savePost = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (!post.text.trim()) throw new Error('نص المحتوى مطلوب');
      if (!post.image) throw new Error('صورة الغلاف مطلوبة');
      if (post.type === 'reel' && !post.videoUrl) throw new Error('فيديو الريلز مطلوب');

      const payload = { ...post, productId: post.productId || null };
      if (editPost) {
        await api.patch(`/trend/merchant/posts/${editPost}`, payload);
        setMessage('تم تحديث المحتوى.');
      } else {
        await api.post('/trend/merchant/posts', payload);
        setMessage('تم نشر المحتوى.');
      }
      resetPost();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر حفظ المحتوى');
    } finally {
      setSaving(false);
    }
  };

  const saveStory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (!story.mediaUrl) throw new Error('صورة أو فيديو القصة مطلوب');
      const payload = {
        ...story,
        productId: story.productId || null,
        durationHours: Number(story.durationHours),
      };
      if (editStory) {
        await api.patch(`/stories/merchant/${editStory}`, payload);
        setMessage('تم تحديث القصة.');
      } else {
        await api.post('/stories/merchant', payload);
        setMessage('تم نشر القصة داخل الترند.');
      }
      resetStory();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر حفظ القصة');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (url) => {
    if (!window.confirm('حذف العنصر نهائيًا؟')) return;
    try {
      await api.delete(url);
      setMessage('تم الحذف.');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر الحذف');
    }
  };

  const togglePost = async (postId, current) => {
    try {
      await api.patch(`/trend/merchant/posts/${postId}/publish`, { isPublished: !current });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تغيير حالة المنشور');
    }
  };

  const toggleStory = async (storyId, current) => {
    try {
      await api.patch(`/stories/merchant/${storyId}`, { isPublished: !current });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تغيير حالة القصة');
    }
  };

  const ProductPicker = ({ value, onChange }) => {
    const selected = products.find((item) => String(item._id) === String(value));
    return (
      <div className="mtp-product">
        <div className="mtp-field-title">ربط منتج من متجرك فقط</div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث بالاسم أو SKU"
        />
        {selected && (
          <div className="mtp-selected">✅ {selected.nameAr || selected.nameEn}</div>
        )}
        <div className="mtp-products">
          {merchantProducts.slice(0, 40).map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => onChange(String(item._id))}
              className={String(value) === String(item._id) ? 'selected' : ''}
            >
              <span>{item.nameAr || item.nameEn}</span>
              <small>{item.sku || ''}</small>
            </button>
          ))}
          {!merchantProducts.length && <div className="mtp-empty-small">لا توجد منتجات مطابقة.</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="mtp" dir="rtl">
      <style>{css}</style>

      <header className="mtp-head">
        <div>
          <div className="mtp-eyebrow">TREND STUDIO • MERCHANT</div>
          <h1>استديو الترند</h1>
          <p>منشورات وريلز وقصص داخل الترند فقط. المنتجات المتاحة هنا هي منتجات متجرك فقط.</p>
        </div>
        <span className="mtp-badge">بدون LIVE</span>
      </header>

      <div className="mtp-tabs">
        <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>
          📝 منشورات + ريلز
        </button>
        <button className={tab === 'stories' ? 'active' : ''} onClick={() => setTab('stories')}>
          📱 القصص
        </button>
      </div>

      {message && <div className="mtp-ok">{message}</div>}
      {error && <div className="mtp-error">{error}</div>}

      {loading ? (
        <div className="mtp-card mtp-empty">جارٍ تحميل استديو الترند…</div>
      ) : tab === 'content' ? (
        <div className="mtp-grid">
          <section className="mtp-card">
            <h2>{editPost ? 'تعديل المحتوى' : 'إضافة منشور أو ريلز'}</h2>
            <form className="mtp-form" onSubmit={savePost}>
              <label>
                النوع
                <select value={post.type} onChange={(e) => setPost({ ...post, type: e.target.value })}>
                  <option value="post">منشور</option>
                  <option value="reel">ريلز</option>
                </select>
              </label>

              <label>
                النص
                <textarea value={post.text} onChange={(e) => setPost({ ...post, text: e.target.value })} />
              </label>

              <label>
                صورة الغلاف
                <ImageUploader
                  images={post.image ? [post.image] : []}
                  onChange={(images) => setPost({ ...post, image: images[0] || '' })}
                />
              </label>

              {post.type === 'reel' && (
                <div className="mtp-video">
                  <b>فيديو الريلز</b>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => upload(e.target.files?.[0], 'reel')}
                    disabled={uploading}
                  />
                  {post.videoUrl && <video controls src={post.videoUrl} />}
                </div>
              )}

              <ProductPicker
                value={post.productId}
                onChange={(productId) => setPost({ ...post, productId })}
              />

              <label className="mtp-check">
                <input
                  type="checkbox"
                  checked={post.isPublished}
                  onChange={(e) => setPost({ ...post, isPublished: e.target.checked })}
                />
                نشر مباشرة
              </label>

              <div className="mtp-actions">
                <button disabled={saving || uploading} className="primary">
                  {editPost ? 'حفظ التعديل' : 'نشر المحتوى'}
                </button>
                {editPost && (
                  <button type="button" className="secondary" onClick={resetPost}>إلغاء</button>
                )}
              </div>
            </form>
          </section>

          <section className="mtp-card">
            <div className="mtp-list-head">
              <h2>محتوى متجري</h2>
              <button className="secondary" onClick={load}>تحديث</button>
            </div>
            <div className="mtp-list">
              {posts.length ? posts.map((item) => (
                <article className="mtp-item" key={item.id}>
                  {item.type === 'reel' && item.videoUrl ? (
                    <video controls src={item.videoUrl} />
                  ) : (
                    <img src={item.image} alt="" />
                  )}
                  <div>
                    <div className="mtp-meta">
                      <b>{item.type === 'reel' ? 'ريلز' : 'منشور'}</b>
                      <span>{item.isPublished ? 'منشور' : 'مخفي'}</span>
                      <span>♥ {item.likes || 0}</span>
                      <span>👁 {item.views || 0}</span>
                      {item.productName && <span>🛍️ {item.productName}</span>}
                    </div>
                    <p>{item.text}</p>
                    <div className="mtp-actions">
                      <button
                        className="secondary"
                        onClick={() => {
                          setEditPost(item.id);
                          setPost({
                            type: item.type || 'post',
                            text: item.text || '',
                            image: item.image || '',
                            videoUrl: item.videoUrl || '',
                            productId: item.productId || '',
                            isPublished: item.isPublished !== false,
                          });
                        }}
                      >
                        تعديل
                      </button>
                      <button className="secondary" onClick={() => togglePost(item.id, item.isPublished)}>
                        {item.isPublished ? 'إخفاء' : 'نشر'}
                      </button>
                      <button className="danger" onClick={() => remove(`/trend/merchant/posts/${item.id}`)}>
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="mtp-empty">لا يوجد محتوى للمتجر.</div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="mtp-grid">
          <section className="mtp-card">
            <h2>{editStory ? 'تعديل القصة' : 'إضافة قصة داخل الترند'}</h2>
            <form className="mtp-form" onSubmit={saveStory}>
              <label>
                صورة أو فيديو
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => upload(e.target.files?.[0], 'story')}
                  disabled={uploading}
                />
              </label>

              {story.mediaUrl && (
                story.mediaType === 'video' ? (
                  <video controls className="mtp-story-media" src={story.mediaUrl} />
                ) : (
                  <img className="mtp-story-media" src={story.mediaUrl} alt="" />
                )
              )}

              <label>
                نص القصة
                <textarea
                  maxLength={500}
                  value={story.caption}
                  onChange={(e) => setStory({ ...story, caption: e.target.value })}
                />
              </label>

              <ProductPicker
                value={story.productId}
                onChange={(productId) => setStory({ ...story, productId })}
              />

              <label>
                مدة الظهور بالساعات
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={story.durationHours}
                  onChange={(e) => setStory({ ...story, durationHours: e.target.value })}
                />
              </label>

              <label className="mtp-check">
                <input
                  type="checkbox"
                  checked={story.isPublished}
                  onChange={(e) => setStory({ ...story, isPublished: e.target.checked })}
                />
                نشر القصة مباشرة
              </label>

              <div className="mtp-actions">
                <button className="primary" disabled={saving || uploading}>
                  {editStory ? 'حفظ التعديل' : 'نشر القصة'}
                </button>
                {editStory && (
                  <button type="button" className="secondary" onClick={resetStory}>إلغاء</button>
                )}
              </div>
            </form>
          </section>

          <section className="mtp-card">
            <div className="mtp-list-head">
              <h2>قصص متجري داخل الترند</h2>
              <button className="secondary" onClick={load}>تحديث</button>
            </div>
            <div className="mtp-list">
              {stories.length ? stories.map((item) => (
                <article className="mtp-item" key={item.id}>
                  {item.mediaType === 'video' ? (
                    <video controls src={item.mediaUrl} />
                  ) : (
                    <img src={item.mediaUrl} alt="" />
                  )}
                  <div>
                    <div className="mtp-meta">
                      <b>{item.isPublished ? 'منشورة' : 'مخفية'}</b>
                      {item.productName && <span>🛍️ {item.productName}</span>}
                    </div>
                    <p>{item.caption || 'بدون نص'}</p>
                    <div className="mtp-actions">
                      <button
                        className="secondary"
                        onClick={() => {
                          setEditStory(item.id);
                          setStory({
                            mediaType: item.mediaType || 'image',
                            mediaUrl: item.mediaUrl || '',
                            caption: item.caption || '',
                            productId: item.productId || '',
                            durationHours: item.durationHours || 24,
                            isPublished: item.isPublished !== false,
                          });
                        }}
                      >
                        تعديل
                      </button>
                      <button className="secondary" onClick={() => toggleStory(item.id, item.isPublished)}>
                        {item.isPublished ? 'إخفاء' : 'نشر'}
                      </button>
                      <button className="danger" onClick={() => remove(`/stories/merchant/${item.id}`)}>
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="mtp-empty">لا توجد قصص للمتجر.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const css = `
.mtp{max-width:1220px;margin:0 auto;padding:0 0 34px;font-family:Cairo,Arial,sans-serif;color:#111827}
.mtp-head{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:20px}
.mtp-eyebrow{font-size:11px;font-weight:900;letter-spacing:2px;color:#e60023}
.mtp-head h1{margin:7px 0 5px;font-size:34px;font-weight:900}
.mtp-head p{margin:0;color:#64748b;font-size:14px}
.mtp-badge{padding:9px 13px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:900;white-space:nowrap}
.mtp-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:15px}
.mtp-tabs button{border:1px solid #e2e8f0;background:#fff;color:#334155;border-radius:12px;padding:11px 15px;font-weight:800;cursor:pointer}
.mtp-tabs button.active{background:#111827;color:#fff;border-color:#111827}
.mtp-ok,.mtp-error{padding:12px 14px;border-radius:12px;margin:0 0 14px;font-size:13px;font-weight:800}
.mtp-ok{background:#ecfdf5;color:#047857}
.mtp-error{background:#fef2f2;color:#b91c1c}
.mtp-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:16px}
.mtp-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:18px;box-shadow:0 8px 26px rgba(15,23,42,.05)}
.mtp-card h2{margin:0 0 15px;font-size:18px}
.mtp-form{display:flex;flex-direction:column;gap:13px}
.mtp-form label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:800;color:#334155}
.mtp-form input,.mtp-form select,.mtp-form textarea,.mtp-product input{width:100%;box-sizing:border-box;border:1px solid #dbe3ec;border-radius:11px;padding:10px 11px;font:inherit;background:#fff;color:#111827}
.mtp-form textarea{min-height:100px;resize:vertical}
.mtp-video{display:flex;flex-direction:column;gap:8px;padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0}
.mtp-video video,.mtp-item video{width:100%;max-height:280px;object-fit:cover;border-radius:12px;background:#0f172a}
.mtp-story-media{width:100%;max-height:360px;object-fit:cover;border-radius:12px;background:#f8fafc}
.mtp-product{padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
.mtp-field-title{font-size:12px;font-weight:900;margin-bottom:8px}
.mtp-selected{margin-top:8px;padding:8px 10px;background:#ecfdf5;color:#047857;border-radius:9px;font-size:12px;font-weight:800}
.mtp-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px;max-height:210px;overflow:auto}
.mtp-products button{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:9px;border:1px solid #e2e8f0;border-radius:9px;background:#fff;text-align:right;cursor:pointer}
.mtp-products button.selected{border-color:#111827;background:#f1f5f9}
.mtp-products span{font-size:11px;font-weight:800;color:#0f172a}
.mtp-products small{font-size:9px;color:#64748b}
.mtp-empty-small{grid-column:1/-1;color:#64748b;font-size:11px;padding:8px}
.mtp-check{flex-direction:row!important;align-items:center;gap:8px!important}
.mtp-check input{width:auto!important}
.mtp-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.mtp-actions button{border:0;border-radius:10px;padding:9px 12px;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
.mtp-actions button:disabled{opacity:.55;cursor:not-allowed}
.primary{background:#111827;color:#fff}
.secondary{background:#f1f5f9;color:#334155}
.danger{background:#fef2f2;color:#b91c1c}
.mtp-list-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
.mtp-list-head h2{margin:0}
.mtp-list{display:flex;flex-direction:column;gap:12px}
.mtp-item{display:grid;grid-template-columns:160px minmax(0,1fr);gap:12px;padding:11px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}
.mtp-item>img{width:160px;height:150px;object-fit:cover;border-radius:10px;background:#f1f5f9}
.mtp-item>video{width:160px;height:150px;object-fit:cover}
.mtp-item p{margin:9px 0;color:#475569;font-size:12px;line-height:1.7}
.mtp-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:10px;color:#64748b}
.mtp-meta b{color:#111827}
.mtp-empty{text-align:center;padding:40px 16px;color:#64748b}
@media (max-width:900px){.mtp-grid{grid-template-columns:1fr}.mtp-head{align-items:flex-start;flex-direction:column}.mtp-item{grid-template-columns:1fr}.mtp-item>img,.mtp-item>video{width:100%;height:220px}.mtp-products{grid-template-columns:1fr}}
`;
