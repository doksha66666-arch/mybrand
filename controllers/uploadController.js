const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const requireCloudinary = () => {
  if (!isCloudinaryConfigured) {
    const error = new Error('خدمة تخزين الوسائط غير مهيأة. يجب إعداد Cloudinary قبل رفع الملفات.');
    error.statusCode = 503;
    throw error;
  }
};

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.on('error', reject);
    stream.end(buffer);
  });

exports.getVideoUploadSignature = async (req, res, next) => {
  try {
    requireCloudinary();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'mybrand/live-presentations';
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);
    return res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
      resourceType: 'video',
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME)}/video/upload`,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'لم يتم إرفاق أي صورة' });
    requireCloudinary();

    const result = await uploadBuffer(req.file.buffer, {
      folder: 'mybrand/products',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
      resourceType: result.resource_type,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadProductVideo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'لم يتم إرفاق أي فيديو' });
    requireCloudinary();

    const result = await uploadBuffer(req.file.buffer, {
      folder: 'mybrand/products/videos',
      resource_type: 'video',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
      resourceType: result.resource_type,
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
