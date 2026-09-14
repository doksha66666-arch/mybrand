import api from './api/client';

(() => {
  if (typeof window === 'undefined' || window.__MYBRAND_TREND_LIVE_COMMENTS__) return;
  window.__MYBRAND_TREND_LIVE_COMMENTS__ = true;

  const timers = new Map();

  const ensureStyles = () => {
    if (document.getElementById('mybrand-trend-live-comments-style')) return;
    const style = document.createElement('style');
    style.id = 'mybrand-trend-live-comments-style';
    style.textContent = `
      .trend-app .trend-live-comments-overlay{position:absolute;right:12px;left:12px;bottom:78px;z-index:7;display:flex;flex-direction:column;align-items:flex-start;gap:7px;max-height:42%;overflow:hidden;pointer-events:none;mask-image:linear-gradient(to bottom,transparent 0,#000 10%,#000 100%)}
      .trend-app .trend-live-comment-bubble{max-width:min(86%,340px);padding:7px 10px;border-radius:14px;background:rgba(0,0,0,.58);color:#fff;backdrop-filter:blur(7px);box-shadow:0 5px 18px rgba(0,0,0,.2);font-size:12px;line-height:1.45;direction:rtl;text-align:right;animation:mybrandLiveCommentIn .2s ease-out}
      .trend-app .trend-live-comment-bubble strong{font-weight:900;margin-left:4px}
      .trend-app .trend-live-comment-btn{position:absolute;right:14px;bottom:92px;z-index:8;width:48px;height:48px;border:1px solid rgba(255,255,255,.22);border-radius:50%;background:rgba(0,0,0,.48);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}
      .trend-live-comment-editor{position:absolute;left:12px;right:72px;bottom:18px;z-index:10;display:none;gap:7px;align-items:center}
      .trend-live-comment-editor.is-open{display:flex}
      .trend-live-comment-editor input{flex:1;min-width:0;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:10px 13px;background:rgba(0,0,0,.56);backdrop-filter:blur(8px);color:#fff;outline:none;font:inherit}
      .trend-live-comment-editor input::placeholder{color:rgba(255,255,255,.75)}
      .trend-live-comment-editor button{width:42px;height:42px;border:0;border-radius:50%;background:linear-gradient(100deg,#FF3B30,#FF6A00);color:#fff;font-weight:900;cursor:pointer}
      @keyframes mybrandLiveCommentIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
      @media(min-width:601px){.trend-app .trend-live-comment-btn{right:18px;bottom:104px}.trend-app .trend-live-comments-overlay{right:18px;left:18px;bottom:94px}.trend-live-comment-editor{left:18px;right:86px;bottom:24px}}
    `;
    document.head.appendChild(style);
  };

  const fetchComments = async (streamId) => {
    try {
      const { data } = await api.get(`/live/${streamId}/state`);
      return Array.isArray(data?.comments) ? data.comments : [];
    } catch {
      return [];
    }
  };

  const ensureOverlay = (card) => {
    let overlay = card.querySelector('.trend-live-comments-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'trend-live-comments-overlay';
      overlay.setAttribute('aria-live', 'polite');
      card.appendChild(overlay);
    }
    return overlay;
  };

  const renderOverlay = (card, comments) => {
    const overlay = ensureOverlay(card);
    overlay.innerHTML = '';
    comments.slice(-6).forEach((comment) => {
      const bubble = document.createElement('div');
      bubble.className = 'trend-live-comment-bubble';
      const name = document.createElement('strong');
      name.textContent = comment.name || 'عميل MYBRAND';
      const text = document.createElement('span');
      text.textContent = comment.text || '';
      bubble.append(name, text);
      overlay.appendChild(bubble);
    });
  };

  const startOverlayPolling = (card, streamId) => {
    if (timers.has(streamId)) return;
    const poll = async () => {
      if (!card.isConnected || !card.classList.contains('trend-live-card')) {
        clearInterval(timers.get(streamId));
        timers.delete(streamId);
        return;
      }
      renderOverlay(card, await fetchComments(streamId));
    };
    poll();
    const timer = window.setInterval(poll, 1200);
    timers.set(streamId, timer);
  };

  const enhanceCard = (card) => {
    const streamId = card.dataset.streamId;
    if (!streamId) return;
    ensureOverlay(card);
    startOverlayPolling(card, streamId);
    if (card.dataset.liveCommentsBound === 'true') return;
    card.dataset.liveCommentsBound = 'true';

    const editor = document.createElement('form');
    editor.className = 'trend-live-comment-editor';
    editor.innerHTML = '<input maxlength="300" autocomplete="off" placeholder="اكتب تعليقك…" aria-label="تعليق"><button type="submit" aria-label="إرسال">➤</button>';
    card.appendChild(editor);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trend-live-comment-btn';
    button.setAttribute('aria-label', 'التعليقات');
    button.textContent = '💬';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      editor.classList.toggle('is-open');
      editor.querySelector('input')?.focus();
    });
    card.appendChild(button);

    editor.addEventListener('click', (event) => event.stopPropagation());
    editor.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const input = editor.querySelector('input');
      const submit = editor.querySelector('button[type="submit"]');
      const text = input?.value?.trim();
      if (!text || !input || !submit) return;
      submit.disabled = true;
      try {
        const { data } = await api.post(`/live/${streamId}/comments`, {
          text,
          name: 'عميل MYBRAND',
          viewerId: `viewer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });
        input.value = '';
        renderOverlay(card, Array.isArray(data?.comments) ? data.comments : await fetchComments(streamId));
        editor.classList.remove('is-open');
      } catch (error) {
        window.alert(error?.response?.data?.message || 'تعذر إرسال التعليق.');
      } finally {
        submit.disabled = false;
      }
    });
  };

  const scan = () => {
    ensureStyles();
    document.querySelectorAll('.trend-app .trend-live-card[data-stream-id]').forEach(enhanceCard);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
