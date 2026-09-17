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
const { getDashboardStats } = require('../controllers/dashboardStatsController');
const { getDailyReports, getDailyReport, archiveDailyReport } = require('../controllers/dailyOrderReportController');
const { updateOrderStatus } = require('../controllers/orderStatusController');
const { getMerchantFulfillmentOrders, updateMerchantFulfillmentStatus, getMerchantSales } = require('../controllers/merchantOrderController');
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
router.get('/merchant/sales', merchantOnly, approvedMerchantOnly, getMerchantSales);
router.get('/merchant/fulfillment', merchantOnly, approvedMerchantOnly, getMerchantFulfillmentOrders);
router.put('/merchant/fulfillment/:id', merchantOnly, approvedMerchantOnly, updateMerchantFulfillmentStatus);
router.post('/:id/cancel', cancelOrder);
router.get('/reports/daily', adminOnly, getDailyReports);
router.get('/reports/daily/:date', adminOnly, getDailyReport);
router.post('/reports/daily/archive', adminOnly, archiveDailyReport);
router.get('/reports/summary', adminOnly, getDashboardStats);
router.get('/stats/summary', getDashboardStats);
router.get('/:id', merchantOrderAccess, merchantOrderDataSanitizer, customerOrderDataSanitizer, getOrderById);
router.get('/', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/payment-status', adminOnly, updatePaymentStatus);

module.exports = router;
