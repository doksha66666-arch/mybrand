const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');

const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, reason, type = 'return', note = '' } = req.body;
    if (!orderId || !reason) return res.status(400).json({ message: 'رقم الطلب وسبب الطلب مطلوبان' });
    if (!['return', 'exchange'].includes(type)) return res.status(400).json({ message: 'نوع الطلب غير صالح' });
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });
    if (!['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'لا يمكن إنشاء طلب إرجاع لهذا الطلب في حالته الحالية' });
    }
    const existing = await ReturnRequest.findOne({ order: order._id, user: req.user._id, status: { $nin: ['rejected', 'completed'] } });
    if (existing) return res.status(409).json({ message: 'يوجد بالفعل طلب إرجاع أو استبدال لهذا الطلب' });
    const request = await ReturnRequest.create({ order: order._id, user: req.user._id, reason, type, note });
    return res.status(201).json({ request });
  } catch (error) { next(error); }
};

const getMyReturnRequests = async (req, res, next) => {
  try {
    const requests = await ReturnRequest.find({ user: req.user._id }).populate('order', 'orderNumber status total placedAt').sort({ createdAt: -1 });
    return res.json({ requests });
  } catch (error) { next(error); }
};

const getAllReturnRequests = async (req, res, next) => {
  try {
    const requests = await ReturnRequest.find().populate('user', 'name email phone').populate('order', 'orderNumber status total placedAt').sort({ createdAt: -1 });
    return res.json({ requests });
  } catch (error) { next(error); }
};

const updateReturnRequest = async (req, res, next) => {
  try {
    const { status, adminNote = '' } = req.body;
    if (!['pending', 'reviewing', 'approved', 'rejected', 'completed'].includes(status)) return res.status(400).json({ message: 'حالة الطلب غير صالحة' });
    const request = await ReturnRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'طلب الإرجاع غير موجود' });
    request.status = status;
    request.adminNote = adminNote;
    await request.save();
    return res.json({ request });
  } catch (error) { next(error); }
};

module.exports = { createReturnRequest, getMyReturnRequests, getAllReturnRequests, updateReturnRequest };
