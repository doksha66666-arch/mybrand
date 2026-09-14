const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const isApprovedProduct = (product) => product && product.isActive && (!product.status || product.status === 'approved') && (!product.merchant || product.merchant.status === 'approved');
const getVariant = (product, variantId) => variantId ? product.variants.id(variantId) : null;
const getUnitPrice = (product, variant) => Number(product.price) + Number(variant?.priceModifier || 0);

const populateCart = (cart) => cart.populate('items.product', 'nameAr nameEn images price stock isActive status variants');

const calcTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    const product = item.product;
    const variant = product?.variants?.id?.(item.variantId);
    const unitPrice = product ? getUnitPrice(product, variant) : Number(item.priceAtAdd || 0);
    return sum + unitPrice * item.quantity;
  }, 0);
  return { subtotal: Math.round(subtotal * 100) / 100 };
};

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    await populateCart(cart);
    const { subtotal } = calcTotals(cart.items);
    res.json({ cart, subtotal });
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'معرف المنتج غير صالح' });
    if (variantId && !mongoose.isValidObjectId(variantId)) return res.status(400).json({ message: 'معرف الخيار غير صالح' });
    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 1000) return res.status(400).json({ message: 'الكمية يجب أن تكون رقمًا صحيحًا بين 1 و1000' });

    const product = await Product.findById(productId).populate('merchant', 'status');
    if (!isApprovedProduct(product)) return res.status(404).json({ message: 'المنتج غير متاح' });
    const variant = getVariant(product, variantId);
    if (variantId && !variant) return res.status(400).json({ message: 'الخيار المحدد غير موجود' });
    const availableStock = variant ? Number(variant.stock || 0) : Number(product.stock || 0);
    if (availableStock < requestedQuantity) return res.status(409).json({ message: 'الكمية المطلوبة غير متوفرة في المخزون' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    const existing = cart.items.find((i) => i.product.toString() === productId && String(i.variantId || null) === String(variantId || null));
    const newQuantity = (existing?.quantity || 0) + requestedQuantity;
    if (newQuantity > availableStock) return res.status(409).json({ message: 'الكمية الإجمالية في السلة تتجاوز المخزون المتاح' });
    if (existing) existing.quantity = newQuantity;
    else cart.items.push({ product: productId, variantId: variantId || null, quantity: requestedQuantity, priceAtAdd: getUnitPrice(product, variant) });
    cart.updatedAt = Date.now();
    await cart.save();
    await populateCart(cart);
    res.json({ cart, subtotal: calcTotals(cart.items).subtotal });
  } catch (err) { next(err); }
};

exports.updateItemQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const requestedQuantity = Number(req.body.quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 1000) return res.status(400).json({ message: 'الكمية يجب أن تكون رقمًا صحيحًا بين 1 و1000' });
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'السلة غير موجودة' });
    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'العنصر غير موجود في السلة' });
    const product = await Product.findById(item.product).populate('merchant', 'status');
    if (!isApprovedProduct(product)) return res.status(409).json({ message: 'المنتج لم يعد متاحًا' });
    const variant = getVariant(product, item.variantId);
    if (item.variantId && !variant) return res.status(409).json({ message: 'الخيار المحدد لم يعد موجودًا' });
    const availableStock = variant ? Number(variant.stock || 0) : Number(product.stock || 0);
    if (requestedQuantity > availableStock) return res.status(409).json({ message: 'الكمية المطلوبة تتجاوز المخزون المتاح' });
    item.quantity = requestedQuantity;
    item.priceAtAdd = getUnitPrice(product, variant);
    cart.updatedAt = Date.now();
    await cart.save();
    await populateCart(cart);
    res.json({ cart, subtotal: calcTotals(cart.items).subtotal });
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'السلة غير موجودة' });
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
    if (cart.items.length === before) return res.status(404).json({ message: 'العنصر غير موجود في السلة' });
    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ message: 'تم حذف العنصر من السلة', cart });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) { cart.items = []; await cart.save(); }
    res.json({ message: 'تم تفريغ السلة' });
  } catch (err) { next(err); }
};
