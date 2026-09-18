const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getSupportConfig, updateSupportConfig, createTicket, myTickets, allTickets, getAdminTicket, replyTicket, adminUpdateTicket } = require('../controllers/supportController');

router.get('/', getSupportConfig);
router.put('/', protect, adminOnly, updateSupportConfig);
router.post('/tickets', protect, createTicket);
router.get('/tickets/my', protect, myTickets);
router.post('/tickets/:id/messages', protect, replyTicket);
router.get('/tickets/all', protect, adminOnly, allTickets);\nrouter.get('/tickets/:id', protect, adminOnly, getAdminTicket);
router.put('/tickets/:id', protect, adminOnly, adminUpdateTicket);

module.exports = router;
