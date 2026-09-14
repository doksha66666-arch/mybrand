const Wishlist = require('../models/Wishlist');

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
