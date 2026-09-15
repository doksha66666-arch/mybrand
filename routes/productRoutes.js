const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getAllProductsAdmin,
  getMyProducts,
  getPendingProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  reviewProduct,
} = require('../controllers/productController');
const { protect, adminOnly, merchantOnly, approvedMerchantOnly } = require('../middleware/auth');

// عام - يجب أن يسبق ':slug' حتى لا يفسَّر كـ slug
router.get('/mine', protect, merchantOnly, getMyProducts);
router.get('/pending', protect, adminOnly, getPendingProducts);
router.get('/admin/all', protect, adminOnly, getAllProductsAdmin);

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// الموظفون يمرون عبر RBAC، والتجار يحتاجون اعتمادًا مسبقًا.
const adminOrApprovedMerchant = (req, res, next) => {
  if (req.user?.role === 'merchant') return approvedMerchantOnly(req, res, next);
  return adminOnly(req, res, next);
};

router.post('/', protect, adminOrApprovedMerchant, createProduct);
router.put('/:id', protect, adminOrApprovedMerchant, updateProduct);
router.delete('/:id', protect, adminOrApprovedMerchant, deleteProduct);

// مراجعة المنتج: adminOnly يطبق RBAC للموظفين حسب صلاحية المنتجات.
router.put('/:id/review', protect, adminOnly, reviewProduct);

module.exports = router;
