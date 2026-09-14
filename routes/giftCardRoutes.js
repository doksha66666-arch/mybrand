const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const controller = require('../controllers/giftCardController');

router.use(protect);
router.get('/mine', controller.mine);
router.post('/redeem', controller.redeem);
router.get('/', adminOnly, controller.listAdmin);
router.post('/', adminOnly, controller.create);
router.put('/:id', adminOnly, controller.update);
router.delete('/:id', adminOnly, controller.remove);

module.exports = router;
