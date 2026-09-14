const express = require('express');
const router = express.Router();
const { getAllOffers, createOffer, updateOffer, toggleOffer, deleteOffer } = require('../controllers/offerController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/', getAllOffers);
router.post('/', createOffer);
router.put('/:id', updateOffer);
router.put('/:id/toggle', toggleOffer);
router.delete('/:id', deleteOffer);

module.exports = router;
