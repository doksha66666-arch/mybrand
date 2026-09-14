const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlistItem } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getWishlist);
router.post('/toggle', toggleWishlistItem);

module.exports = router;
