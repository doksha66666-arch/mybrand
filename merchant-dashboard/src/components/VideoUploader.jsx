import React, { useState } from 'react';
import api from '../api/client';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export default function VideoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    setError('');
    setProgress(0);
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) return setError('يسمح فقط بـ MP4 وWEBM وMOV');
    if (file.size > MAX_VIDEO_SIZE) return setError('حجم الفيديو يجب ألا يتجاوز 100MB');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const { data } = await api.post('/upload/video', formData, {
        timeout: 300000,
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      if (!data?.url) throw new Error('لم يرجع الخادم رابط الفيديو');
      onChange(data.url);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر رفع الفيديو، حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 10, marginBottom: 12 }}>
      <label style={{ display: 'block', padding: 14, borderRadius: 8, border: '1px dashed #94A3B8', textAlign: 'center', fontSize: 13, color: '#64748B', cursor: uploading ? 'wait' : 'pointer' }}>
        {uploading ? `جارٍ رفع الفيديو... ${progress}%` : value ? 'استبدال فيديو المنتج' : '+ رفع فيديو المنتج (MP4, WEBM, MOV — حتى 100MB)'}
        <input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={uploading} style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
      </label>
      {error && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{error}</p>}
      {value && !uploading && <video src={value} controls playsInline preload="metadata" style={{ width: '100%', maxHeight: 240, marginTop: 10, borderRadius: 10, background: '#0F172A' }} />}
      {value && <button type="button" onClick={() => onChange('')} style={{ border: 0, background: 'transparent', color: '#DC2626', fontSize: 12, cursor: 'pointer' }}>إزالة الفيديو</button>}
    </div>
  );
}
