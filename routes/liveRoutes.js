const express = require('express');
const crypto = require('crypto');
const LiveStream = require('../models/LiveStream');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { protect, merchantOnly, approvedMerchantOnly } = require('../middleware/auth');

const router = express.Router();
const sessions = new Map();
const STREAM_TTL_MS = 2 * 60 * 60 * 1000;
const VIEWER_TTL_MS = 45 * 1000;
const MAX_COMMENTS = 80;
const MAX_VIEWERS = Math.max(1, Number(process.env.LIVE_MAX_VIEWERS || 25));
const RATE_WINDOW_MS = 60 * 1000;
const COMMENT_RATE_LIMIT = 8;
const rateBuckets = new Map();

const makeId = (prefix) => `${prefix}_${crypto.randomBytes(9).toString('hex')}`;
const makeSecret = () => crypto.randomBytes(32).toString('hex');
const hashKey = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const pathFor = (stream) => {
  const explicit = String(stream?.obsStreamPath || '').trim();
  if (explicit && explicit !== 'live_') return explicit;
  const hash = String(stream?.obsStreamKeyHash || '').trim();
  if (hash) return `live_${hash}`;
  const key = String(stream?.obsStreamKey || '').trim();
  return key ? `live_${key}` : null;
};

const sessionFor = (streamId) => {
  const key = String(streamId);
  let session = sessions.get(key);
  if (!session) {
    session = { viewers: new Map(), likes: new Set(), comments: [], createdAt: Date.now() };
    sessions.set(key, session);
  }
  return session;
};

const publicStream = (stream, session = sessionFor(stream._id || stream.id)) => ({
  id: String(stream._id || stream.id),
  broadcasterId: String(stream.broadcasterId),
  title: stream.title,
  description: stream.description,
  startedAt: new Date(stream.startedAt).toISOString(),
  endedAt: stream.endedAt ? new Date(stream.endedAt).toISOString() : null,
  createdAt: stream.createdAt ? new Date(stream.createdAt).toISOString() : null,
  ingestMode: stream.ingestMode || 'upload',
  videoUrl: stream.videoUrl || null,
  mediaPath: stream.ingestMode === 'upload' ? null : pathFor(stream),
  playbackUrl: null,
  viewerCount: session.viewers.size,
  likes: session.likes.size,
});

const obsPayload = () => null;
const activeDocuments = async () => LiveStream.find({ status: 'live' }).sort({ startedAt: 1 }).select('+obsStreamKeyHash').lean();

const endStream = async (stream) => {
  await LiveStream.updateOne(
    { _id: stream._id, status: 'live' },
    { $set: { status: 'ended', endedAt: new Date(), lastHeartbeatAt: new Date() } }
  );
  sessions.delete(String(stream._id));
};

const getStream = async (req, res) => {
  const stream = await LiveStream.findOne({ _id: req.params.streamId, status: 'live' }).select('+obsStreamKey +obsStreamKeyHash');
  if (!stream) {
    res.status(404).json({ message: 'البث غير موجود أو انتهى' });
    return null;
  }
  if (stream.ingestMode !== 'upload' && Date.now() - stream.startedAt.getTime() > STREAM_TTL_MS) {
    await endStream(stream);
    res.status(410).json({ message: 'انتهت مدة البث تلقائيًا' });
    return null;
  }
  return stream;
};

const allowRate = (key, limit) => {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { startedAt: now, count: 0 };
  if (now - bucket.startedAt >= RATE_WINDOW_MS) { bucket.startedAt = now; bucket.count = 0; }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count <= limit;
};

const broadcasterAccess = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  return merchantOnly(req, res, (err) => {
    if (err) return next(err);
    return approvedMerchantOnly(req, res, next);
  });
};

const ownerFilter = (req) => (req.user.role === 'admin' ? {} : { broadcasterId: req.user._id });

// Best-effort Cloudinary public_id extraction for older saved videos that were
// created before videoPublicId was stored on the LiveStream document.
const publicIdFromCloudinaryUrl = (videoUrl) => {
  try {
    const url = new URL(String(videoUrl || ''));
    const host = url.hostname.toLowerCase();
    if (!host.endsWith('cloudinary.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const uploadIndex = parts.findIndex((part) => part === 'upload');
    if (uploadIndex === -1) return null;
    const afterUpload = parts.slice(uploadIndex + 1);
    while (afterUpload.length && /^v\d+$/.test(afterUpload[0])) afterUpload.shift();
    if (!afterUpload.length) return null;
    const file = afterUpload.join('/');
    return file.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

const destroyCloudinaryVideo = async (stream) => {
  if (!isCloudinaryConfigured) return false;
  const publicId = String(stream.videoPublicId || publicIdFromCloudinaryUrl(stream.videoUrl) || '').trim();
  if (!publicId) return false;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'video', invalidate: true });
  return true;
};

// The old RTMP/OBS broadcaster is retired. Any orphaned OBS live rows are
// ended on the next backend restart so the public app cannot keep surfacing them.
LiveStream.updateMany({ status: 'live', ingestMode: { $in: ['obs', 'browser'] } }, { $set: { status: 'ended', endedAt: new Date() } }).catch(() => {});

router.get('/active', async (req, res, next) => {
  try {
    const docs = await activeDocuments();
    const list = docs.map((stream) => publicStream(stream));
    return res.json({ active: list.length > 0, stream: list[0] || null, streams: list });
  } catch (error) { return next(error); }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({ broadcasterId: req.user._id, status: 'live' }).sort({ startedAt: -1 }).select('+obsStreamKey +obsStreamKeyHash');
    return res.json({ active: Boolean(stream), stream: stream ? publicStream(stream) : null, obs: obsPayload(stream) });
  } catch (error) { return next(error); }
});

// Saved prerecorded presentations. Ending a presentation only changes its
// status to ended, so the video remains available for replay until deleted.
router.get('/library', protect, broadcasterAccess, async (req, res, next) => {
  try {
    const docs = await LiveStream.find({ ...ownerFilter(req), status: 'ended', ingestMode: 'upload', videoUrl: { $ne: null } })
      .sort({ endedAt: -1, createdAt: -1 })
      .limit(60)
      .lean();
    return res.json({ videos: docs.map((stream) => publicStream(stream)) });
  } catch (error) { return next(error); }
});

// New flow: presenter uploads a prerecorded video, then publishes that video
// as the current live presentation. No webcam, OBS, RTMP or MediaMTX is used.
router.post('/start-upload', protect, broadcasterAccess, async (req, res, next) => {
  try {
    const existing = await LiveStream.findOne({ broadcasterId: req.user._id, status: 'live' });
    if (existing) return res.status(409).json({ message: 'لديك عرض مباشر يعمل بالفعل.', stream: publicStream(existing) });

    const videoUrl = String(req.body?.videoUrl || '').trim();
    if (!/^https?:\/\//i.test(videoUrl)) return res.status(400).json({ message: 'رابط الفيديو غير صالح.' });

    const title = String(req.body?.title || 'عرض MYBRAND').trim().slice(0, 120) || 'عرض MYBRAND';
    const description = String(req.body?.description || '').trim().slice(0, 500);
    const videoPublicId = String(req.body?.videoPublicId || '').trim().slice(0, 500) || null;
    const stream = await LiveStream.create({
      broadcasterId: req.user._id,
      title,
      description,
      status: 'live',
      ingestMode: 'upload',
      videoUrl,
      videoPublicId,
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
    });
    sessions.set(String(stream._id), { viewers: new Map(), likes: new Set(), comments: [], createdAt: Date.now() });
    return res.status(201).json({ stream: publicStream(stream), obs: null });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'لديك عرض مباشر يعمل بالفعل.' });
    return next(error);
  }
});

// Start a previously saved presentation without uploading it again.
router.post('/:streamId/replay', protect, broadcasterAccess, async (req, res, next) => {
  try {
    const existingActive = await LiveStream.findOne({ broadcasterId: req.user._id, status: 'live' });
    if (existingActive) return res.status(409).json({ message: 'لديك عرض مباشر يعمل بالفعل. أنهِ العرض الحالي أولًا.' });

    const stream = await LiveStream.findOne({
      _id: req.params.streamId,
      ...ownerFilter(req),
      status: 'ended',
      ingestMode: 'upload',
      videoUrl: { $ne: null },
    });
    if (!stream) return res.status(404).json({ message: 'الفيديو المحفوظ غير موجود.' });

    stream.status = 'live';
    stream.startedAt = new Date();
    stream.endedAt = null;
    stream.lastHeartbeatAt = new Date();
    await stream.save();
    sessions.set(String(stream._id), { viewers: new Map(), likes: new Set(), comments: [], createdAt: Date.now() });
    return res.json({ stream: publicStream(stream) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'لديك عرض مباشر يعمل بالفعل.' });
    return next(error);
  }
});

// Delete a saved presentation and, when possible, remove its Cloudinary video
// as well so the library does not leave unused media behind.
router.delete('/:streamId/library', protect, broadcasterAccess, async (req, res, next) => {
  try {
    const stream = await LiveStream.findOne({
      _id: req.params.streamId,
      ...ownerFilter(req),
      status: 'ended',
      ingestMode: 'upload',
    });
    if (!stream) return res.status(404).json({ message: 'الفيديو المحفوظ غير موجود.' });

    let storageDeleted = false;
    try {
      storageDeleted = await destroyCloudinaryVideo(stream);
    } catch (storageError) {
      return res.status(502).json({ message: 'تعذر حذف ملف الفيديو من التخزين. لم يتم حذف بطاقة الفيديو حتى لا تفقد النسخة المحفوظة.', storageError: storageError?.message || 'Cloudinary error' });
    }

    await LiveStream.deleteOne({ _id: stream._id });
    sessions.delete(String(stream._id));
    return res.json({ ok: true, storageDeleted });
  } catch (error) { return next(error); }
});

// Legacy endpoint kept harmless for older clients; it no longer starts OBS.
router.post('/start', protect, broadcasterAccess, async (req, res) => {
  return res.status(410).json({ message: 'تم استبدال البث المباشر برفع فيديو من المذيع.' });
});

router.post('/:streamId/stop', protect, async (req, res, next) => {
  try {
    const stream = await getStream(req, res);
    if (!stream) return;
    if (String(stream.broadcasterId) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'لا تملك صلاحية إيقاف هذا العرض' });
    await endStream(stream);
    return res.json({ ok: true, stream: publicStream({ ...stream.toObject(), status: 'ended', endedAt: new Date() }) });
  } catch (error) { return next(error); }
});

router.get('/:streamId/state', async (req, res, next) => {
  try {
    const stream = await getStream(req, res);
    if (!stream) return;
    const session = sessionFor(stream._id);
    return res.json({ stream: publicStream(stream, session), comments: session.comments.slice(-30) });
  } catch (error) { return next(error); }
});

router.post('/:streamId/join', async (req, res, next) => {
  try {
    const stream = await getStream(req, res);
    if (!stream) return;
    const viewerKey = String(req.body?.viewerKey || '').trim().slice(0, 120) || makeId('viewer');
    const session = sessionFor(stream._id);
    let viewerId = null;
    for (const [id, viewer] of session.viewers.entries()) {
      if (viewer.viewerKey === viewerKey) { viewerId = id; viewer.lastSeenAt = Date.now(); break; }
    }
    if (!viewerId) {
      if (session.viewers.size >= MAX_VIEWERS) return res.status(503).json({ message: 'العرض ممتلئ حاليًا. جرّب بعد قليل.' });
      viewerId = makeId('viewer');
      session.viewers.set(viewerId, { viewerKey, lastSeenAt: Date.now() });
    }
    return res.status(201).json({ viewerId, viewerCount: session.viewers.size });
  } catch (error) { return next(error); }
});

router.post('/:streamId/heartbeat/:viewerId', async (req, res, next) => {
  try {
    const stream = await getStream(req, res);
    if (!stream) return;
    const viewer = sessionFor(stream._id).viewers.get(req.params.viewerId);
    if (!viewer) return res.status(404).json({ message: 'جلسة المشاهدة غير موجودة' });
    viewer.lastSeenAt = Date.now();
    return res.json({ ok: true, viewerCount: sessionFor(stream._id).viewers.size });
  } catch (error) { return next(error); }
});

router.delete('/:streamId/viewer/:viewerId', async (req, res, next) => {
  try {
    const stream = await getStream(req, res);
    if (!stream) return;
    sessionFor(stream._id).viewers.delete(req.params.viewerId);
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.post('/:streamId/like', async (req, res, next) => {
  try {
    const stream = await getStream(req, res);
    if (!stream) return;
    const viewerKey = String(req.body?.viewerKey || '').trim().slice(0, 120);
    if (!viewerKey) return res.status(400).json({ message: 'معرّف المشاهد مطلوب' });
    const session = sessionFor(stream._id);
    if (req.body?.liked === false) session.likes.delete(viewerKey); else session.likes.add(viewerKey);
    return res.json({ liked: session.likes.has(viewerKey), likes: session.likes.size });
  } catch (error) { return next(error); }
});

router.post('/:streamId/comments', async (req, res, next) => {
  try {
    const stream = await getStream(req, res);
    if (!stream) return;
    const viewerId = String(req.body?.viewerId || '').trim();
    if (!allowRate(`comment:${req.ip}:${viewerId || 'anon'}`, COMMENT_RATE_LIMIT)) return res.status(429).json({ message: 'أرسلت تعليقات كثيرة. انتظر قليلًا.' });
    const text = String(req.body?.text || '').trim().slice(0, 300);
    if (!text) return res.status(400).json({ message: 'اكتب تعليقًا أولًا' });
    const name = String(req.body?.name || 'عميل MYBRAND').trim().slice(0, 60) || 'عميل MYBRAND';
    const item = { id: makeId('comment'), viewerId: viewerId || null, name, text, createdAt: new Date().toISOString() };
    const session = sessionFor(stream._id);
    session.comments.push(item);
    if (session.comments.length > MAX_COMMENTS) session.comments.splice(0, session.comments.length - MAX_COMMENTS);
    return res.status(201).json({ comment: item, comments: session.comments.slice(-30) });
  } catch (error) { return next(error); }
});

setInterval(async () => {
  const now = Date.now();
  try {
    await LiveStream.updateMany(
      { status: 'live', ingestMode: { $ne: 'upload' }, startedAt: { $lt: new Date(now - STREAM_TTL_MS) } },
      { $set: { status: 'ended', endedAt: new Date(now) } }
    );
  } catch (_) {}
  for (const [streamId, session] of sessions.entries()) {
    for (const [viewerId, viewer] of session.viewers.entries()) if (now - viewer.lastSeenAt > VIEWER_TTL_MS) session.viewers.delete(viewerId);
    if (now - session.createdAt > STREAM_TTL_MS) sessions.delete(streamId);
  }
}, 15 * 1000).unref();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) if (now - bucket.startedAt > RATE_WINDOW_MS * 2) rateBuckets.delete(key);
}, RATE_WINDOW_MS).unref();

module.exports = router;
