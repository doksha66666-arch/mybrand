import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/client';
import './BannerPlacement.css';

const normalizeImage = (value) => { if (!value) return ''; const text = String(value).trim(); if (/^(data:image|https?:|blob:|file:)/i.test(text)) return text; if (text.startsWith('//')) return `https:${text}`; return `${API_ORIGIN}/${text.replace(/^\/+/, '')}`; };
const isExternalLink = (value) => /^(https?:|mailto:|tel:|sms:)/i.test(String(value || '').trim());

export default function BannerPlacement({ placement }) {
  const [banners, setBanners] = useState([]);
  useEffect(() => {
    let active = true;
    api.get('/banners', { params: { placement } }).then(({ data }) => active && setBanners(data.banners || [])).catch(() => active && setBanners([]));
    return () => { active = false; };
  }, [placement]);
  if (!banners.length) return null;
  return <section className="mybrand-page-banners" aria-label="بنرات الصفحة">{banners.map((banner) => {
    const image = <img src={normalizeImage(banner.image)} alt={banner.titleAr || 'بانر'} loading="lazy" />;
    if (!banner.buttonLink) return <div className="mybrand-page-banner" key={banner._id}>{image}</div>;
    const href = String(banner.buttonLink).trim();
    const content = isExternalLink(href)
      ? <a href={href} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{image}</a>
      : <Link to={href}>{image}</Link>;
    return <div className="mybrand-page-banner" key={banner._id}>{content}</div>;
  })}</section>;
}
