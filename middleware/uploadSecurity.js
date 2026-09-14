const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

async function validateUploadedImage(req, res, next) {
  try {
    const files = [];
    if (req.file) files.push(req.file);
    if (Array.isArray(req.files)) files.push(...req.files);
    if (req.files && !Array.isArray(req.files)) {
      Object.values(req.files).forEach((list) => files.push(...(list || [])));
    }

    for (const file of files) {
      if (!file || !Buffer.isBuffer(file.buffer)) {
        return res.status(400).json({ message: 'Invalid uploaded file' });
      }

      if (!ALLOWED_MIME.has(file.mimetype)) {
        return res.status(400).json({ message: 'Only JPG, PNG, and WEBP images are allowed' });
      }

      const detected = detectImageType(file.buffer);
      if (!detected || !ALLOWED_MIME.has(detected.mime)) {
        return res.status(400).json({ message: 'File content does not match an allowed image type' });
      }

      if (!ALLOWED_EXT.has(detected.ext)) {
        return res.status(400).json({ message: 'Unsupported image format' });
      }

      if (detected.mime !== file.mimetype) {
        return res.status(400).json({ message: 'File type mismatch' });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = validateUploadedImage;
