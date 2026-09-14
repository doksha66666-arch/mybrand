import api from './api/client';

const RTC_CONFIG = {
  bundlePolicy: 'max-bundle',
  iceTransportPolicy: 'all',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    ...(import.meta.env.VITE_TURN_URL ? [{
      urls: import.meta.env.VITE_TURN_URL,
      username: import.meta.env.VITE_TURN_USERNAME || undefined,
      credential: import.meta.env.VITE_TURN_CREDENTIAL || undefined,
    }] : []),
  ],
};

const sessions = new Map();
let observer = null;
let scanTimer = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function viewerKey() {
  try {
    return `viewer_${crypto.randomUUID()}`;
  } catch {
    return `viewer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

async function waitForIceComplete(peer, timeout = 12000) {
  if (peer.iceGatheringState === 'complete') return;
  await new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      peer.removeEventListener('icegatheringstatechange', finish);
      resolve();
    };
    const timer = setTimeout(finish, timeout);
    peer.addEventListener('icegatheringstatechange', finish);
  });
}

function getStreamId(card) {
  return card.dataset.streamId || card.getAttribute('data-live-stream-id') || '';
}

function styleOnce() {
  if (document.getElementById('mybrand-live-clean-style')) return;
  const style = document.createElement('style');
  style.id = 'mybrand-live-clean-style';
  style.textContent = `
    .trend-app .live-grid{display:block!important;padding:0!important;margin:0!important}
    .trend-app .trend-live-card{position:relative!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;aspect-ratio:auto!important;padding:0!important;margin:0!important;border-radius:0!important;overflow:hidden!important;background:#000!important}
    .trend-app .trend-live-card .trend-live-video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;background:#000!important}
    .trend-app .trend-live-card:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.38),transparent 30%,transparent 65%,rgba(0,0,0,.64));z-index:2}
    .trend-app .trend-live-status{position:absolute!important;inset:0!important;z-index:6!important;display:grid!important;place-items:center!important;color:#fff!important;background:rgba(0,0,0,.25)!important;font-weight:900!important;pointer-events:none!important}
    .trend-app .trend-live-card[data-live-connected="true"] .trend-live-status{display:none!important}
    .trend-app .trend-live-overlay{position:absolute!important;inset:0!important;z-index:7!important;padding:18px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;pointer-events:none!important}
    .trend-app .trend-live-live{display:inline-flex!important;align-self:flex-start!important;background:#e60023!important;color:#fff!important;border-radius:999px!important;padding:7px 11px!important;font-weight:900!important}
    .trend-app .trend-live-copy{max-width:78%!important;color:#fff!important;text-shadow:0 2px 12px #000!important}
    .trend-app .trend-live-copy .title{font-weight:900!important;font-size:18px!important}
    .trend-app .trend-live-copy .desc{margin-top:4px!important;font-weight:700!important;font-size:12px!important;opacity:.92!important}
    @media(min-width:700px){.trend-app .live-grid{max-width:480px!important;margin:0 auto!important}.trend-app .trend-live-card{max-width:480px!important}}
  `;
  document.head.appendChild(style);
}

function ensureMarkup(card, stream) {
  card.classList.add('trend-live-card');
  card.dataset.streamId = String(stream.id);
  card.removeAttribute('href');
  card.removeAttribute('target');
  const title = String(stream.title || 'بث مباشر');
  const desc = String(stream.description || '');
  card.innerHTML = `
    <video class="trend-live-video" autoplay playsinline preload="auto"></video>
    <div class="trend-live-overlay">
      <span class="trend-live-live">● مباشر الآن</span>
      <div class="trend-live-copy"><div class="title"></div><div class="desc"></div></div>
    </div>
    <div class="trend-live-status">جارٍ تشغيل البث…</div>
  `;
  card.querySelector('.title').textContent = title;
  card.querySelector('.desc').textContent = desc;
  return card.querySelector('.trend-live-video');
}

function cleanup(streamId) {
  const session = sessions.get(streamId);
  if (!session) return;
  session.closed = true;
  clearTimeout(session.answerTimer);
  try { session.peer?.close(); } catch {}
  sessions.delete(streamId);
}

async function connect(card, stream) {
  const streamId = String(stream.id);
  if (sessions.has(streamId) || !card.isConnected) return;

  const video = ensureMarkup(card, stream);
  const status = card.querySelector('.trend-live-status');
  const session = { peer: null, viewerId: null, closed: false, gotTrack: false, answerTimer: null };
  sessions.set(streamId, session);

  try {
    const peer = new RTCPeerConnection(RTC_CONFIG);
    session.peer = peer;

    const inbound = new MediaStream();
    const videoReceiver = peer.addTransceiver('video', { direction: 'recvonly' });
    const audioReceiver = peer.addTransceiver('audio', { direction: 'recvonly' });

    const attachStream = () => {
      if (session.closed) return;
      video.srcObject = inbound;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      video.play().catch(() => {});
      if (inbound.getTracks().length) {
        session.gotTrack = true;
        card.dataset.liveConnected = 'true';
        if (status) status.style.display = 'none';
      }
    };

    peer.ontrack = ({ track }) => {
      if (!inbound.getTracks().some((item) => item.id === track.id)) inbound.addTrack(track);
      attachStream();
      track.onunmute = attachStream;
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        card.dataset.liveConnected = 'true';
        if (status) status.style.display = 'none';
        video.play().catch(() => {});
      }
      if (peer.connectionState === 'failed' && !session.closed) {
        cleanup(streamId);
        if (card.isConnected) setTimeout(() => connect(card, stream), 1200);
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'failed' && !session.closed) {
        cleanup(streamId);
        if (card.isConnected) setTimeout(() => connect(card, stream), 1200);
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForIceComplete(peer);

    const response = await api.post(`/live/${streamId}/offer`, {
      offer: peer.localDescription,
      viewerKey: viewerKey(),
    });
    session.viewerId = response.data.viewerId;

    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (session.closed) return;
      const { data } = await api.get(`/live/${streamId}/answer/${session.viewerId}`);
      if (data?.answer) {
        await peer.setRemoteDescription(data.answer);
        video.play().catch(() => {});
        return;
      }
      await sleep(150);
    }

    throw new Error('answer-timeout');
  } catch {
    if (session.closed) return;
    cleanup(streamId);
    if (status) {
      status.style.display = 'grid';
      status.textContent = 'تعذر تشغيل البث. إعادة المحاولة…';
    }
    if (card.isConnected) setTimeout(() => connect(card, stream), 1500);
  }
}

async function loadActiveStreams() {
  try {
    const { data } = await api.get('/live/active');
    return Array.isArray(data?.streams) ? data.streams : (data?.stream ? [data.stream] : []);
  } catch {
    return [];
  }
}

async function render() {
  styleOnce();
  const grid = document.querySelector('.trend-app .live-grid');
  if (!grid) {
    [...sessions.keys()].forEach(cleanup);
    return;
  }

  const streams = await loadActiveStreams();
  const byId = new Map(streams.map((stream) => [String(stream.id), stream]));

  for (const stream of streams) {
    let card = grid.querySelector(`[data-stream-id="${CSS.escape(String(stream.id))}"]`);
    if (!card) {
      card = document.createElement('div');
      grid.appendChild(card);
    }
    if (!sessions.has(String(stream.id))) connect(card, stream);
  }

  grid.querySelectorAll('.trend-live-card').forEach((card) => {
    const id = getStreamId(card);
    if (!byId.has(String(id))) cleanup(String(id));
  });
}

function scheduleRender() {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(render, 150);
}

function init() {
  if (observer) return;
  observer = new MutationObserver(scheduleRender);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleRender);
  render();
}

init();
