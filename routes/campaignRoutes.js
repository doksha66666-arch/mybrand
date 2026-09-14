const express = require('express');
const router = express.Router();
const {
  getActiveCampaigns,
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  toggleCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { protect, adminOnly } = require('../middleware/auth');

// عام
router.get('/', getActiveCampaigns);

// Admin فقط
router.get('/all', protect, adminOnly, getAllCampaigns);
router.post('/', protect, adminOnly, createCampaign);
router.put('/:id', protect, adminOnly, updateCampaign);
router.put('/:id/toggle', protect, adminOnly, toggleCampaign);
router.delete('/:id', protect, adminOnly, deleteCampaign);

module.exports = router;
