const TrendEvent = require('../models/TrendEvent');

const serialize = (event) => ({ ...event, id: String(event._id) });

exports.listEvents = async (req, res, next) => {
  try {
    const events = await TrendEvent.find({ isPublished: true }).sort({ startsAt: 1 }).lean();
    res.json({ events: events.map(serialize) });
  } catch (error) { next(error); }
};

exports.adminListEvents = async (req, res, next) => {
  try {
    const events = await TrendEvent.find({}).sort({ startsAt: 1 }).lean();
    res.json({ events: events.map(serialize) });
  } catch (error) { next(error); }
};

exports.adminCreateEvent = async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const image = String(req.body.image || '').trim();
    const startsAt = new Date(req.body.startsAt);
    const endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
    if (!title || !image || Number.isNaN(startsAt.getTime())) return res.status(400).json({ message: 'اسم الفعالية والصورة وتاريخ البداية مطلوبة' });
    if (endsAt && Number.isNaN(endsAt.getTime())) return res.status(400).json({ message: 'تاريخ النهاية غير صحيح' });
    if (endsAt && endsAt <= startsAt) return res.status(400).json({ message: 'تاريخ النهاية يجب أن يكون بعد البداية' });
    const event = await TrendEvent.create({ title, description, image, startsAt, endsAt, isPublished: req.body.isPublished !== false });
    res.status(201).json({ event: serialize(event.toObject()) });
  } catch (error) { next(error); }
};

exports.adminUpdateEvent = async (req, res, next) => {
  try {
    const event = await TrendEvent.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    for (const field of ['title', 'description', 'image']) if (req.body[field] !== undefined) event[field] = String(req.body[field]).trim();
    if (req.body.startsAt !== undefined) event.startsAt = new Date(req.body.startsAt);
    if (req.body.endsAt !== undefined) event.endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
    if (req.body.isPublished !== undefined) event.isPublished = Boolean(req.body.isPublished);
    if (!event.title || !event.image || Number.isNaN(new Date(event.startsAt).getTime())) return res.status(400).json({ message: 'بيانات الفعالية غير مكتملة' });
    if (event.endsAt && (Number.isNaN(new Date(event.endsAt).getTime()) || event.endsAt <= event.startsAt)) return res.status(400).json({ message: 'تواريخ الفعالية غير صحيحة' });
    await event.save();
    res.json({ event: serialize(event.toObject()) });
  } catch (error) { next(error); }
};

exports.adminSetPublished = async (req, res, next) => {
  try {
    const event = await TrendEvent.findByIdAndUpdate(req.params.eventId, { isPublished: Boolean(req.body.isPublished) }, { new: true });
    if (!event) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    res.json({ event: serialize(event.toObject()) });
  } catch (error) { next(error); }
};

exports.adminDeleteEvent = async (req, res, next) => {
  try {
    const event = await TrendEvent.findByIdAndDelete(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'الفعالية غير موجودة' });
    res.json({ message: 'تم حذف الفعالية نهائيًا' });
  } catch (error) { next(error); }
};
