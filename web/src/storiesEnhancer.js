import api from './api/client';

let installed = false;
const esc = (value='') => String(value).replace(/[&<>'"]/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money = (value) => {
  if (value === null || value === undefined || value === '') return '';
  try { return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(Number(value))} ج.م`; }
  catch (_) { return `${esc(value)} ج.م`; }
};

function installStories() {
  if (installed) return;
  installed = true;
  let groups = [];
  let active = null;
  let keyHandler = null;

  async function load() {
    try {
      const { data } = await api.get('/stories');
      groups = Array.isArray(data?.groups) ? data.groups : [];
      renderStrip();
    } catch (_) {}
  }

  function renderStrip() {
    const row = document.querySelector('.stories-row');
    if (!row) return;
    row.innerHTML = groups.map((g, i) => {
      const first = g.stories?.[0];
      if (!first) return '';
      const media = first.mediaType === 'video'
        ? `<video src="${esc(first.mediaUrl)}" muted playsinline></video>`
        : `<img src="${esc(first.mediaUrl)}" alt="${esc(g.ownerName)}"/>`;
      return `<button type="button" class="story real-story" data-story-group="${i}"><span class="story-ring">${media}</span><span>${esc(g.ownerName)}</span><span class="real-story-count">${g.stories.length}</span></button>`;
    }).join('');
    row.querySelectorAll('[data-story-group]').forEach((el)=>el.addEventListener('click',()=>openViewer(Number(el.dataset.storyGroup),0)));
  }

  function closeViewer() {
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    if (active) { active.remove(); active = null; }
    document.body.classList.remove('story-viewer-open');
  }

  function openViewer(groupIndex, storyIndex) {
    const group = groups[groupIndex];
    if (!group?.stories?.length) return;
    let idx = Math.max(0, Math.min(storyIndex, group.stories.length - 1));
    closeViewer();
    document.body.classList.add('story-viewer-open');

    const root = document.createElement('div');
    root.className = 'stories-viewer stories-viewer-v2';
    root.setAttribute('data-story-viewer-v2', 'true');
    root.innerHTML = `
      <div class="stories-backdrop"></div>
      <section class="stories-stage stories-stage-v2" role="dialog" aria-modal="true" aria-label="قصص ${esc(group.ownerName)}">
        <div class="stories-progress" aria-hidden="true"></div>
        <header class="stories-header stories-header-v2">
          <div class="stories-owner-avatar">${esc((group.ownerName || 'M').slice(0,1))}</div>
          <div class="stories-owner-info"><strong>${esc(group.ownerName)}</strong><span>قصة ${idx + 1} من ${group.stories.length}</span></div>
        </header>
        <button type="button" class="stories-close stories-close-v2" aria-label="إغلاق">×</button>
        <div class="stories-media stories-media-v2"></div>
        <div class="stories-caption stories-caption-v2"></div>
        <button type="button" class="stories-prev stories-prev-v2" aria-label="السابق">‹</button>
        <button type="button" class="stories-next stories-next-v2" aria-label="التالي">›</button>
      </section>
    `;
    document.body.appendChild(root);
    active = root;

    const media = root.querySelector('.stories-media-v2');
    const caption = root.querySelector('.stories-caption-v2');
    const progress = root.querySelector('.stories-progress');
    const ownerInfo = root.querySelector('.stories-owner-info');

    const draw = () => {
      const story = group.stories[idx];
      progress.innerHTML = group.stories.map((_, i) => `<i class="${i < idx ? 'done' : i === idx ? 'active' : ''}"></i>`).join('');
      ownerInfo.innerHTML = `<strong>${esc(group.ownerName)}</strong><span>قصة ${idx + 1} من ${group.stories.length}</span>`;
      media.innerHTML = story.mediaType === 'video'
        ? `<video src="${esc(story.mediaUrl)}" autoplay playsinline controls></video>`
        : `<img src="${esc(story.mediaUrl)}" alt="${esc(story.caption || story.productName || group.ownerName)}"/>`;

      const captionHtml = story.caption ? `<div class="stories-text">${esc(story.caption)}</div>` : '';
      const productHtml = story.productSlug ? `
        <article class="stories-product-card">
          <div class="stories-product-thumb">${story.productImage ? `<img src="${esc(story.productImage)}" alt="${esc(story.productName)}"/>` : '<span>🛍️</span>'}</div>
          <div class="stories-product-info">
            <span class="stories-product-label">منتج مرتبط بالقصة</span>
            <strong>${esc(story.productName || 'المنتج')}</strong>
            ${story.productPrice !== null && story.productPrice !== undefined ? `<span class="stories-product-price">${money(story.productPrice)}</span>` : ''}
          </div>
          <a class="stories-product-buy" href="/products/${encodeURIComponent(story.productSlug)}">🛒 اشترِ الآن</a>
        </article>` : '';
      caption.innerHTML = `${captionHtml}${productHtml}`;
    };

    const next = () => { if (idx < group.stories.length - 1) { idx++; draw(); } else closeViewer(); };
    const prev = () => { if (idx > 0) { idx--; draw(); } };

    root.querySelector('.stories-close').onclick = closeViewer;
    root.querySelector('.stories-backdrop').onclick = closeViewer;
    root.querySelector('.stories-next').onclick = next;
    root.querySelector('.stories-prev').onclick = prev;
    keyHandler = (e) => {
      if (!active) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') next();
      if (e.key === 'ArrowRight') prev();
    };
    document.addEventListener('keydown', keyHandler);
    draw();
  }

  const observer = new MutationObserver(() => {
    if (document.querySelector('.stories-row') && !document.querySelector('.real-story')) renderStrip();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', load);
  load();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installStories); else installStories();
