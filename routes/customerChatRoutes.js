const express = require('express');
const router = express.Router();
const controller = require('../controllers/customerChatController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/admin', protect, adminOnly, controller.listAdminConversations);
router.get('/admin/:id', protect, adminOnly, controller.getAdminConversation);
router.post('/admin/:id/reply', protect, adminOnly, controller.agentReply);
router.post('/admin/:id/close', protect, adminOnly, controller.closeConversation);
router.get('/:visitorId', controller.getConversation);
router.post('/message', controller.sendMessage);
router.post('/request-agent', controller.requestAgent);

module.exports = router;
