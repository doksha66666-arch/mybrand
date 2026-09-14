const express = require('express');
const router = express.Router();
const { getPublicConfig } = require('../controllers/configController');

// عام - لا يحتاج تسجيل دخول
router.get('/', getPublicConfig);

module.exports = router;
