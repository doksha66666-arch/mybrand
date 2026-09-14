const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { createReturnRequest, getMyReturnRequests, getAllReturnRequests, updateReturnRequest } = require('../controllers/returnController');

router.use(protect);
router.post('/', createReturnRequest);
router.get('/my', getMyReturnRequests);
router.get('/', adminOnly, getAllReturnRequests);
router.put('/:id', adminOnly, updateReturnRequest);

module.exports = router;
