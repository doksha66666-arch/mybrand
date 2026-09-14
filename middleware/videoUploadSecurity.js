const ALLOWED_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

function detectVideoType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  // MP4/MOV/ISO-BMFF: an ftyp box starts at byte 4.
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return 'video/mp4';
  }

  // WebM/Matroska: EBML header.
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return 'video/webm';
  }

  return null;
}

module.exports = function validateUploadedVideo(req, res, next) {
  try {
    const file = req.file;
    if (!file || !Buffer.isBuffer(file.buffer)) {
      return res.status(400).json({ message: 'لم يتم إرفاق فيديو صالح' });
    }

    if (!ALLOWED_MIME.has(file.mimetype)) {
      return res.status(400).json({ message: 'يسمح فقط بفيديو MP4 أو WEBM أو MOV' });
    }

    const detected = detectVideoType(file.buffer);
    if (!detected) {
      return res.status(400).json({ message: 'محتوى الفيديو غير صالح أو غير مدعوم' });
    }

    // QuickTime/MOV and MP4 both use the ISO-BMFF ftyp container.
    if (file.mimetype === 'video/webm' && detected !== 'video/webm') {
      return res.status(400).json({ message: 'نوع الفيديو لا يطابق محتواه' });
    }
    if (file.mimetype !== 'video/webm' && detected !== 'video/mp4') {
      return res.status(400).json({ message: 'نوع الفيديو لا يطابق محتواه' });
    }

    next();
  } catch (error) {
    next(error);
  }
};
