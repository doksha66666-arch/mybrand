const express = require('express');
const router = express.Router();
const {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,
} = require('../controllers/bannerController');
const { protect, adminOnly } = require('../middleware/auth');

// عام
router.get('/', getActiveBanners);

// Admin فقط
router.get('/all', protect, adminOnly, getAllBanners);
router.post('/', protect, adminOnly, createBanner);
router.put('/:id', protect, adminOnly, updateBanner);
router.put('/:id/toggle', protect, adminOnly, toggleBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

module.exports = router;
