const express = require('express');
const router = express.Router();
const { listStaff, createStaff } = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, listStaff);
router.post('/', protect, adminOnly, createStaff);

module.exports = router;
