const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  listPosts,
  listMyLikes,
  toggleLike,
  addView,
  addComment,
  adminListPosts,
  adminCreatePost,
  adminUpdatePost,
  adminSetPublished,
  adminDeletePost,
  adminDeleteComment,
} = require('../controllers/trendController');

// Public/customer Trend feed.
router.get('/posts', listPosts);
router.get('/posts/me/likes', protect, listMyLikes);
router.post('/posts/:postId/like', protect, toggleLike);
router.post('/posts/:postId/view', addView);
router.post('/posts/:postId/comments', protect, addComment);

// Platform-only Trend studio. No merchant/customer access is allowed.
router.use('/admin', protect, adminOnly);
router.get('/admin/posts', adminListPosts);
router.post('/admin/posts', adminCreatePost);
router.patch('/admin/posts/:postId', adminUpdatePost);
router.patch('/admin/posts/:postId/publish', adminSetPublished);
router.delete('/admin/posts/:postId', adminDeletePost);
router.delete('/admin/comments/:commentId', adminDeleteComment);

module.exports = router;
