const express = require('express');
const router = express.Router();
const {
  getAccount,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/accountController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAccount);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.put('/addresses/:addressId/default', setDefaultAddress);

module.exports = router;
