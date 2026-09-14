const express = require('express');
const router = express.Router();

// Compatibility endpoint for dashboards that query available AI models.
router.get('/', (_req, res) => {
  const configuredModel = String(process.env.GEMINI_MODEL || '').trim();
  res.json({
    success: true,
    models: configuredModel ? [{ id: configuredModel, provider: 'gemini' }] : [],
    configured: Boolean(configuredModel && process.env.GEMINI_API_KEY),
    message: configuredModel ? 'AI model configuration loaded.' : 'No AI model is configured.'
  });
});

module.exports = router;
