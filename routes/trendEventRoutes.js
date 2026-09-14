const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  listEvents,
  adminListEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminSetPublished,
  adminDeleteEvent,
} = require('../controllers/trendEventController');

router.get('/', listEvents);
router.use('/admin', protect, adminOnly);
router.get('/admin', adminListEvents);
router.post('/admin', adminCreateEvent);
router.patch('/admin/:eventId', adminUpdateEvent);
router.patch('/admin/:eventId/publish', adminSetPublished);
router.delete('/admin/:eventId', adminDeleteEvent);

module.exports = router;
