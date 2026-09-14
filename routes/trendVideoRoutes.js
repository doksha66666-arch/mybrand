const express = require('express');
const router = express.Router();
const { protect, adminOnly, merchantOnly, approvedMerchantOnly } = require('../middleware/auth');
const upload = require('../middleware/videoUpload');
const videoUploadSecurity = require('../middleware/videoUploadSecurity');
const { uploadTrendVideo } = require('../controllers/trendVideoController');

const trendVideoAccess = (req, res, next) => {
  if (req.user?.role === 'admin') return adminOnly(req, res, next);
  if (req.user?.role === 'merchant') return merchantOnly(req, res, (error) => error ? next(error) : approvedMerchantOnly(req, res, next));
  return res.status(403).json({ message: 'رفع فيديو الترند متاح للأدمن والتجار المعتمدين فقط' });
};

router.post('/', protect, trendVideoAccess, upload.single('video'), videoUploadSecurity, uploadTrendVideo);

module.exports = router;
