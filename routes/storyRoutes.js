const express = require('express');
const router = express.Router();
const { protect, adminOnly, merchantOnly } = require('../middleware/auth');
const {
  listPublic,
  adminList, merchantList,
  adminCreate, merchantCreate,
  adminUpdate, merchantUpdate,
  adminDelete, merchantDelete,
} = require('../controllers/storyController');

router.get('/', listPublic);
router.use('/admin', protect, adminOnly);
router.get('/admin', adminList);
router.post('/admin', adminCreate);
router.patch('/admin/:id', adminUpdate);
router.delete('/admin/:id', adminDelete);
router.use('/merchant', protect, merchantOnly);
router.get('/merchant', merchantList);
router.post('/merchant', merchantCreate);
router.patch('/merchant/:id', merchantUpdate);
router.delete('/merchant/:id', merchantDelete);

module.exports = router;
