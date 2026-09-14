const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getMerchantOrders,
  getOrderById,
} = require('../controllers/orderController');
const { cancelOrder } = require('../controllers/orderCancellationController');
const { getAllOrders, updatePaymentStatus } = require('../controllers/adminOrderController');
const { getDailyReports, getDailyReport, archiveDailyReport } = require('../controllers/dailyOrderReportController');
const { updateOrderStatus } = require('../controllers/orderStatusController');
const { getMerchantFulfillmentOrders, updateMerchantFulfillmentStatus } = require('../controllers/merchantOrderController');
const { protect, adminOnly, merchantOnly, approvedMerchantOnly } = require('../middleware/auth');
const merchantOrderAccess = require('../middleware/merchantOrderAccess');
const merchantOrderDataSanitizer = require('../middleware/merchantOrderDataSanitizer');
const customerOrderDataSanitizer = require('../middleware/customerOrderDataSanitizer');
const lockCustomerIdentity = require('../middleware/lockCustomerIdentity');
const couponPerUserLimit = require('../middleware/couponPerUserLimit');
const validatePaymentMethod = require('../middleware/validatePaymentMethod');
const { loyaltyOrderContext } = require('../services/loyaltyRequestContext');

router.use(protect);
router.post('/', lockCustomerIdentity, customerOrderDataSanitizer, validatePaymentMethod, couponPerUserLimit, loyaltyOrderContext, createOrder);
router.get('/my', customerOrderDataSanitizer, getMyOrders);
router.get('/merchant/mine', merchantOnly, approvedMerchantOnly, merchantOrderDataSanitizer, getMerchantOrders);
router.get('/merchant/fulfillment', merchantOnly, approvedMerchantOnly, getMerchantFulfillmentOrders);
router.put('/merchant/fulfillment/:id', merchantOnly, approvedMerchantOnly, updateMerchantFulfillmentStatus);

// العميل يستطيع إلغاء الطلب فقط قبل التجهيز، مع إعادة المخزون والكوبون والنقاط بأمان.
router.post('/:id/cancel', cancelOrder);

// تقارير وأرشيف الطلبات النهائيّة — للإدارة فقط
router.get('/reports/daily', adminOnly, getDailyReports);
router.get('/reports/daily/:date', adminOnly, getDailyReport);
router.post('/reports/daily/archive', adminOnly, archiveDailyReport);

router.get('/:id', merchantOrderAccess, merchantOrderDataSanitizer, customerOrderDataSanitizer, getOrderById);

// Admin فقط
router.get('/', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/payment-status', adminOnly, updatePaymentStatus);

module.exports = router;
