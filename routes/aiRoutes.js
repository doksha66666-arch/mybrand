const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

// Keep old Railway environment values from breaking the AI after Gemini model updates.
// MYBRAND uses Gemini only, with the current stable free-tier model as the default.
const configuredGeminiModel = String(process.env.GEMINI_MODEL || '').trim();
if (!configuredGeminiModel || configuredGeminiModel.startsWith('gemini-2.5-')) {
  process.env.GEMINI_MODEL = 'gemini-3.6-flash';
}

const aiController = require('../controllers/aiController');
const { adminInsights } = require('../controllers/adminInsightsController');

router.use(protect, adminOnly);
router.post('/admin-chat', aiController.adminChat);
router.post('/admin-insights', adminInsights);
router.post('/admin-action/prepare', aiController.prepareAdminAction);
router.post('/admin-action/execute', aiController.executeAdminAction);

module.exports = router;
