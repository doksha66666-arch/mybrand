const express = require('express');
const router = express.Router();
const { protect, merchantOnly } = require('../middleware/auth');
const {
  listMyPosts,
  createPost,
  updatePost,
  setPostPublished,
  deletePost,
  deleteComment,
  listMyEvents,
  createEvent,
  updateEvent,
  setEventPublished,
  deleteEvent,
} = require('../controllers/merchantTrendController');

// Merchant content is published directly to the storefront; no admin approval gate.
router.use(protect, merchantOnly);
router.get('/posts', listMyPosts);
router.post('/posts', createPost);
router.patch('/posts/:postId', updatePost);
router.patch('/posts/:postId/publish', setPostPublished);
router.delete('/posts/:postId', deletePost);
router.delete('/comments/:commentId', deleteComment);
router.get('/events', listMyEvents);
router.post('/events', createEvent);
router.patch('/events/:eventId', updateEvent);
router.patch('/events/:eventId/publish', setEventPublished);
router.delete('/events/:eventId', deleteEvent);

module.exports = router;
