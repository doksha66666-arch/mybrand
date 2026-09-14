const express = require('express');
const router = express.Router();
const { getCustomers, toggleCustomerStatus, deleteCustomer } = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/', getCustomers);
router.put('/:id/toggle-status', toggleCustomerStatus);
router.delete('/:id', deleteCustomer);

module.exports = router;
