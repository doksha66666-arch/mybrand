import React, { useRef, useState } from 'react';
import api from '../api/client';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function ImageUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    setError('');
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const invalid = files.find((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE);
    if (invalid) {
      setError(!ALLOWED_TYPES.has(invalid.type) ? 'يسمح فقط بـ JPG وPNG وWEBP' : 'حجم الصورة يجب ألا يتجاوز 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await api.post('/upload', formData, { timeout: 300000 });
        if (!data?.url) throw new Error('لم يرجع الخادم رابط الصورة');
        uploadedUrls.push(data.url);
      }
      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر رفع الصورة، حاول مرة أخرى');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (url) => onChange(images.filter((i) => i !== url));

  return (
    <div style={styles.container}>
      <label style={styles.dropzone}>
        {uploading ? 'جارٍ رفع الصور...' : '+ أضف صورة (JPG, PNG, WEBP — حتى 5MB)'}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {error && <p style={styles.error}>{error}</p>}
      {images.length > 0 && (
        <div style={styles.previewRow}>
          {images.map((url) => (
            <div key={url} style={styles.thumbWrap}>
              <img src={url} alt="" style={styles.thumb} />
              <button type="button" style={styles.removeBtn} onClick={() => removeImage(url)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { marginBottom: 12 },
  dropzone: { display: 'block', padding: 14, borderRadius: 8, border: '1px dashed #94A3B8', textAlign: 'center', fontSize: 13, color: '#64748B', cursor: 'pointer' },
  error: { color: '#DC2626', fontSize: 12, marginTop: 6 },
  previewRow: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  thumbWrap: { position: 'relative', width: 64, height: 64 },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' },
  removeBtn: { position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '20px', padding: 0 },
};
