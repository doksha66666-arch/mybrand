const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getWallet,
  getTransactions,
  previewRedemption,
  adminSettings,
  adminUpdateSettings,
  adminSummary,
  adminCustomers,
  adminAdjust,
} = require('../controllers/loyaltyController');

router.use(protect);
router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.post('/preview', previewRedemption);

router.get('/admin/settings', adminOnly, adminSettings);
router.put('/admin/settings', adminOnly, adminUpdateSettings);
router.get('/admin/summary', adminOnly, adminSummary);
router.get('/admin/customers', adminOnly, adminCustomers);
router.post('/admin/customers/:userId/adjust', adminOnly, adminAdjust);

module.exports = router;
