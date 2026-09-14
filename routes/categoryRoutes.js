const express = require('express');
const router = express.Router();
const {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/admin/all', protect, adminOnly, getAdminCategories);
router.post('/', protect, adminOnly, createCategory);
router.put('/admin/reorder', protect, adminOnly, reorderCategories);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
