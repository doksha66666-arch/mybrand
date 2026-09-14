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

// الإضافة: الأدمن دايمًا مسموح، والتاجر لازم يكون معتمد أولًا
router.post('/', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'merchant') return approvedMerchantOnly(req, res, next);
  return res.status(403).json({ message: 'هذا الإجراء متاح للأدمن أو التجار المعتمدين فقط' });
}, createProduct);

// التعديل والحذف: الأدمن دايمًا مسموح، والتاجر لازم يكون معتمد + مالك المنتج (يتحقق منه الكنترولر)
router.put('/:id', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'merchant') return approvedMerchantOnly(req, res, next);
  return res.status(403).json({ message: 'هذا الإجراء متاح للأدمن أو التجار المعتمدين فقط' });
}, updateProduct);

router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'merchant') return approvedMerchantOnly(req, res, next);
  return res.status(403).json({ message: 'هذا الإجراء متاح للأدمن أو التجار المعتمدين فقط' });
}, deleteProduct);

// مراجعة المنتج (قبول/رفض) - Admin فقط
router.put('/:id/review', protect, adminOnly, reviewProduct);

module.exports = router;
