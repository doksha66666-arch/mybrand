const express = require('express');
const router = express.Router();
const { listStaff, createStaff, updateStaff, removeStaff } = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, listStaff);
router.post('/', protect, adminOnly, createStaff);
router.patch('/:id', protect, adminOnly, updateStaff);
router.delete('/:id', protect, adminOnly, removeStaff);

module.exports = router;
