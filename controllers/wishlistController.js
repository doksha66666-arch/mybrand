const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      'products',
      'nameAr nameEn images price'
    );
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    res.json({ wishlist });
  } catch (err) {
    next(err);
  }
};

exports.toggleWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'معرف المنتج غير صالح' });
    const product = await Product.findById(productId).select('_id isActive status').lean();
    if (!product || !product.isActive || (product.status && product.status !== 'approved')) return res.status(404).json({ message: 'المنتج غير متاح' });
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

    const exists = wishlist.products.some((p) => p.toString() === productId);
    if (exists) {
      wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
    } else {
      wishlist.products.push(productId);
    }
    await wishlist.save();
    res.json({ wishlist, added: !exists });
  } catch (err) {
    next(err);
  }
};
