import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/client';
import './BannerPlacement.css';

const normalizeImage = (value) => { if (!value) return ''; const text = String(value).trim(); if (/^(data:image|https?:|blob:|file:)/i.test(text)) return text; if (text.startsWith('//')) return `https:${text}`; return `${API_ORIGIN}/${text.replace(/^\/+/, '')}`; };

export default function BannerPlacement({ placement }) {
  const [banners, setBanners] = useState([]);
  useEffect(() => {
    let active = true;
    api.get('/banners', { params: { placement } }).then(({ data }) => active && setBanners(data.banners || [])).catch(() => active && setBanners([]));
    return () => { active = false; };
  }, [placement]);
  if (!banners.length) return null;
  return <section className="mybrand-page-banners" aria-label="بنرات الصفحة">{banners.map((banner) => <div className="mybrand-page-banner" key={banner._id}>{banner.buttonLink ? <Link to={banner.buttonLink}><img src={normalizeImage(banner.image)} alt={banner.titleAr || 'بانر'} loading="lazy" /></Link> : <img src={banner.image} alt={banner.titleAr || 'بانر'} loading="lazy" />}</div>)}</section>;
}
