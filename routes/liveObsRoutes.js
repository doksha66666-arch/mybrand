const express = require('express');
const crypto = require('crypto');
const LiveStream = require('../models/LiveStream');
const { protect, merchantOnly, approvedMerchantOnly } = require('../middleware/auth');

const router = express.Router();
const STREAM_TTL_MS = 2 * 60 * 60 * 1000;

const makeSecret = () => `mybrand_${crypto.randomBytes(24).toString('hex')}`;
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const mediaBaseUrl = () => String(process.env.LIVE_MEDIA_URL || '').trim().replace(/\/$/, '');
const rtmpServerUrl = () => String(process.env.LIVE_RTMP_URL || '').trim().replace(/\/$/, '');
const streamPath = (stream) => {
  if (stream?.obsStreamPath) return String(stream.obsStreamPath).trim();
  const hash = String(stream?.obsStreamKeyHash || '').trim();
  return hash ? `live_${hash}` : '';
};

const publicStream = (stream) => {
  const path = streamPath(stream);
  const base = mediaBaseUrl();
  return {
    id: String(stream._id || stream.id),
    broadcasterId: String(stream.broadcasterId),
    title: stream.title,
    description: stream.description,
    startedAt: new Date(stream.startedAt).toISOString(),
    viewerCount: 0,
    likes: 0,
    ingestMode: 'obs',
    media: base && path ? {
      path,
      hlsUrl: `${base}/${encodeURIComponent(path)}/index.m3u8`,
      // Kept for backwards compatibility with older clients.
      whepUrl: `${base}/${encodeURIComponent(path)}/whep`,
    } : null,
  };
};

const requireOwner = (req, res, stream) => {
  if (String(stream.broadcasterId) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403).json({ message: 'لا تملك صلاحية إدارة هذا البث' });
    return false;
  }
  return true;
};

router.post('/start', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  return merchantOnly(req, res, (err) => {
    if (err) return next(err);
    return approvedMerchantOnly(req, res, next);
  });
}, async (req, res, next) => {
  try {
    if (!mediaBaseUrl() || !rtmpServerUrl()) return res.status(503).json({ message: 'خدمة OBS غير مهيأة على الخادم بعد.' });
    const existing = await LiveStream.findOne({ broadcasterId: req.user._id, status: 'live' }).select('+obsStreamKeyHash');
    if (existing) {
      if (existing.ingestMode === 'obs' && existing.obsStreamKeyHash) {
        const path = streamPath(existing);
        return res.json({ stream: publicStream(existing), obs: { serverUrl: rtmpServerUrl(), streamKey: path, path, whepUrl: `${mediaBaseUrl()}/${encodeURIComponent(path)}/whep`, hlsUrl: `${mediaBaseUrl()}/${encodeURIComponent(path)}/index.m3u8` } });
      }
      return res.status(409).json({ message: 'لديك بث مباشر يعمل بالفعل. أوقفه أولًا ثم ابدأ بث OBS.' });
    }

    const title = String(req.body?.title || 'بث MYBRAND من OBS').trim().slice(0, 120) || 'بث MYBRAND من OBS';
    const description = String(req.body?.description || '').trim().slice(0, 500);
    const secret = makeSecret();
    const hash = sha256(secret);
    const path = `live_${hash}`;
    const stream = await LiveStream.create({
      broadcasterId: req.user._id,
      title,
      description,
      status: 'live',
      ingestMode: 'obs',
      obsStreamKeyHash: hash,
      obsStreamPath: path,
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
    });

    return res.status(201).json({
      stream: publicStream(stream),
      obs: { serverUrl: rtmpServerUrl(), streamKey: path, path, whepUrl: `${mediaBaseUrl()}/${encodeURIComponent(path)}/whep`, hlsUrl: `${mediaBaseUrl()}/${encodeURIComponent(path)}/index.m3u8` },
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'لديك بث مباشر يعمل بالفعل.' });
    return next(error);
  }
});

router.get('/:streamId/config', protect, async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({ _id: req.params.streamId, status: 'live' }).select('+obsStreamKeyHash');
    if (!stream) return res.status(404).json({ message: 'البث غير موجود أو انتهى' });
    if (!requireOwner(req, res, stream)) return;
    if (stream.ingestMode !== 'obs' || !stream.obsStreamKeyHash) return res.status(404).json({ message: 'إعدادات OBS غير متاحة لهذه الجلسة.' });
    const path = streamPath(stream);
    return res.json({
      stream: publicStream(stream),
      obs: { serverUrl: rtmpServerUrl(), streamKey: path, path, whepUrl: `${mediaBaseUrl()}/${encodeURIComponent(path)}/whep`, hlsUrl: `${mediaBaseUrl()}/${encodeURIComponent(path)}/index.m3u8` },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:streamId/status', async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({ _id: req.params.streamId, status: 'live' }).select('+obsStreamKeyHash');
    if (!stream) return res.status(404).json({ message: 'البث غير موجود أو انتهى' });
    return res.json({ stream: publicStream(stream), ingestMode: stream.ingestMode || 'browser' });
  } catch (error) {
    return next(error);
  }
});

// MediaMTX authentication for OBS RTMP publish and public WebRTC/WHEP/HLS read.
// HLS requests include child resources (index.m3u8, variant playlists and
// segments). The stream path itself is a 64-hex SHA-256 value and therefore
// acts as an unguessable capability for public reads. This lets HLS playback
// work without requiring browser credentials on every playlist/segment.
router.post('/mediamtx-auth', async (req, res) => {
  try {
    const action = String(req.body?.action || '');
    const path = String(req.body?.path || '');
    const match = /^live_([a-f0-9]{64})(?:\/.*)?$/.exec(path);
    if (!match) return res.status(403).end();

    // HLS/WebRTC readers use the unguessable stream path as the capability.
    // MediaMTX will still return no stream when the path is not actually live.
    if (action === 'read') return res.status(200).end();

    // Publishing remains tied to an active DB session so a leaked path cannot
    // be used to start a new OBS publisher after the session has ended.
    if (action !== 'publish') return res.status(403).end();
    const stream = await LiveStream.findOne({
      status: 'live',
      ingestMode: 'obs',
      obsStreamKeyHash: match[1],
    }).select('+obsStreamKeyHash').lean();

    if (!stream) return res.status(403).end();
    if (Date.now() - new Date(stream.startedAt).getTime() > STREAM_TTL_MS) return res.status(403).end();
    return res.status(200).end();
  } catch {
    return res.status(500).end();
  }
});

module.exports = router;
