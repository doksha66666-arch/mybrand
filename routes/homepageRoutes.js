const express = require('express');
const router = express.Router();
const { getHomepage } = require('../controllers/homepageController');

// عام - لا يحتاج تسجيل دخول
router.get('/', getHomepage);

module.exports = router;
