const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const uploadVideoToCloudinary = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'mybrand/trend-videos',
      resource_type: 'video',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    },
    (err, result) => (err ? reject(err) : resolve(result))
  );
  stream.on('error', reject);
  stream.end(buffer);
});

exports.uploadTrendVideo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'لم يتم إرفاق أي فيديو' });
    if (!isCloudinaryConfigured) {
      const error = new Error('خدمة تخزين الفيديو غير مهيأة في بيئة الإنتاج.');
      error.statusCode = 503;
      throw error;
    }

    const result = await uploadVideoToCloudinary(req.file.buffer);
    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
      duration: result.duration || null,
      width: result.width || null,
      height: result.height || null,
      format: result.format || null,
      bytes: result.bytes || null,
    });
  } catch (err) {
    next(err);
  }
};
