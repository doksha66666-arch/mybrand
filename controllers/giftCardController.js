const crypto = require('crypto');
const GiftCard = require('../models/GiftCard');
const User = require('../models/User');

const normalizeCode = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '');
const activeNow = (card) => card && card.isActive && (!card.expiresAt || card.expiresAt >= new Date()) && card.balance > 0;
const generateCode = () => `MYGIFT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

exports.mine = async (req, res, next) => {
  try {
    const cards = await GiftCard.find({ assignedTo: req.user._id }).sort({ createdAt: -1 }).select('-redemptions');
    const giftBalance = cards.reduce((sum, card) => sum + (activeNow(card) ? Number(card.balance) : 0), 0);
    res.json({ giftBalance, cards });
  } catch (e) { next(e); }
};

exports.redeem = async (req, res, next) => {
  try {
    const code = normalizeCode(req.body.code);
    if (!code) return res.status(400).json({ message: 'أدخل رمز بطاقة الهدايا' });
    const card = await GiftCard.findOne({ code });
    if (!card) return res.status(404).json({ message: 'بطاقة الهدايا غير موجودة' });
    if (!card.isActive) return res.status(400).json({ message: 'بطاقة الهدايا غير مفعلة' });
    if (card.expiresAt && card.expiresAt < new Date()) return res.status(400).json({ message: 'انتهت صلاحية بطاقة الهدايا' });
    if (card.balance <= 0) return res.status(400).json({ message: 'تم استهلاك رصيد بطاقة الهدايا بالكامل' });
    if (card.assignedTo && String(card.assignedTo) !== String(req.user._id)) return res.status(403).json({ message: 'هذه البطاقة مرتبطة بحساب آخر' });
    if (card.assignedTo) return res.status(400).json({ message: 'بطاقة الهدايا مضافة بالفعل إلى حسابك' });

    card.assignedTo = req.user._id;
    card.redeemedAt = new Date();
    card.redemptions.push({ user: req.user._id, amount: card.balance });
    await card.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { giftBalance: Number(card.balance) }, $addToSet: { giftCards: card._id } });
    res.json({ message: `تمت إضافة ${Number(card.balance).toLocaleString('ar-EG')} ج.م إلى رصيدك`, giftBalance: Number(card.balance), card: { _id: card._id, code: card.code, balance: card.balance, expiresAt: card.expiresAt } });
  } catch (e) { next(e); }
};

exports.listAdmin = async (req, res, next) => {
  try { res.json({ cards: await GiftCard.find().populate('assignedTo', 'name email phone').sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const initialBalance = Number(req.body.initialBalance);
    if (!Number.isFinite(initialBalance) || initialBalance <= 0) return res.status(400).json({ message: 'قيمة البطاقة يجب أن تكون أكبر من صفر' });
    const card = await GiftCard.create({ code: normalizeCode(req.body.code) || generateCode(), initialBalance, balance: initialBalance, expiresAt: req.body.expiresAt || null, isActive: req.body.isActive !== false });
    res.status(201).json({ card });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const card = await GiftCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'بطاقة الهدايا غير موجودة' });
    if (req.body.isActive !== undefined) card.isActive = Boolean(req.body.isActive);
    if (req.body.expiresAt !== undefined) card.expiresAt = req.body.expiresAt || null;
    await card.save();
    res.json({ card });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const card = await GiftCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ message: 'بطاقة الهدايا غير موجودة' });
    if (card.assignedTo && card.balance > 0) await User.findByIdAndUpdate(card.assignedTo, { $inc: { giftBalance: -Number(card.balance) }, $pull: { giftCards: card._id } });
    res.json({ message: 'تم حذف بطاقة الهدايا' });
  } catch (e) { next(e); }
};
