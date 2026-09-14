const express = require('express');
const router = express.Router();
const imageUpload = require('../middleware/upload');
const videoUpload = require('../middleware/videoUpload');
const uploadSecurity = require('../middleware/uploadSecurity');
const videoUploadSecurity = require('../middleware/videoUploadSecurity');
const { uploadImage, uploadProductVideo, getVideoUploadSignature } = require('../controllers/uploadController');
const { protect, merchantOnly, approvedMerchantOnly } = require('../middleware/auth');

const approvedMediaUser = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'merchant') {
    return merchantOnly(req, res, (err) => {
      if (err) return next(err);
      return approvedMerchantOnly(req, res, next);
    });
  }
  return res.status(403).json({ message: 'هذا الإجراء متاح للأدمن والتجار المعتمدين فقط' });
};

router.get('/video/signature', protect, approvedMediaUser, getVideoUploadSignature);
router.post('/', protect, approvedMediaUser, imageUpload.single('image'), uploadSecurity, uploadImage);
router.post('/video', protect, approvedMediaUser, videoUpload.single('video'), videoUploadSecurity, uploadProductVideo);

module.exports = router;
