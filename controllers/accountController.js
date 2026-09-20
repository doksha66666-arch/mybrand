const User = require('../models/User');

const normalizePhone = (phone) => {
  let value = String(phone || '').trim().replace(/\s+/g, '').replace(/[()-]/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  if (value.startsWith('+20')) value = `0${value.slice(3)}`;
  else if (/^20\d{10}$/.test(value)) value = `0${value.slice(2)}`;
  else if (/^1\d{9}$/.test(value)) value = `0${value}`;
  return value;
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  preferredLanguage: user.preferredLanguage || 'ar',
  addresses: user.addresses || [],
  points: Number(user.points || 0),
  giftBalance: Number(user.giftBalance || 0),
  giftCards: user.giftCards || [],
  createdAt: user.createdAt,
});

exports.getAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'الحساب غير موجود' });
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, preferredLanguage } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'الحساب غير موجود' });
    if (name !== undefined) { if (!String(name).trim()) return res.status(400).json({ message: 'الاسم مطلوب' }); user.name = String(name).trim(); }
    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });
      if (!/^(?:01\d{9}|\+[1-9]\d{7,14}|\d{7,15})$/.test(normalizedPhone)) return res.status(400).json({ message: 'رقم الهاتف غير صحيح' });
      if (normalizedPhone !== normalizePhone(user.phone)) { const phoneOwner = await User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } }).select('_id'); if (phoneOwner) return res.status(409).json({ message: 'رقم الهاتف مستخدم بالفعل' }); }
      user.phone = normalizedPhone;
    }
    if (preferredLanguage && ['ar', 'en'].includes(preferredLanguage)) user.preferredLanguage = preferredLanguage;
    try { await user.save(); } catch (err) { if (err?.code === 11000 && err?.keyPattern?.phone) return res.status(409).json({ message: 'رقم الهاتف مستخدم بالفعل' }); throw err; }
    res.json({ message: 'تم تحديث بيانات الحساب', user: publicUser(user) });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'أدخل كلمة المرور الحالية والجديدة' });
    if (String(newPassword).length < 12) return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون 12 حرفًا على الأقل' });
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    user.password = newPassword; await user.save(); res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { next(err); }
};

exports.addAddress = async (req, res, next) => {
  try {
    const { label, fullName, phone, country, governorate, center, city, street, building, postalCode, notes, isDefault } = req.body;
    if (!fullName || !phone || !city || !street) return res.status(400).json({ message: 'الاسم ورقم الهاتف والمدينة والعنوان مطلوبة' });
    const user = await User.findById(req.user._id); if (!user) return res.status(404).json({ message: 'الحساب غير موجود' });
    if (isDefault || user.addresses.length === 0) user.addresses.forEach((address) => { address.isDefault = false; });
    user.addresses.push({ label: label || 'عنوان', fullName, phone, country, governorate, center, city, street, building, postalCode, notes, isDefault: !!isDefault || user.addresses.length === 0 }); await user.save();
    res.status(201).json({ message: 'تمت إضافة العنوان', addresses: user.addresses });
  } catch (err) { next(err); }
};
exports.updateAddress = async (req, res, next) => { try { const user = await User.findById(req.user._id); const address = user?.addresses.id(req.params.addressId); if (!address) return res.status(404).json({ message: 'العنوان غير موجود' }); const fields=['label','fullName','phone','country','governorate','center','city','street','building','postalCode','notes']; fields.forEach((field)=>{if(req.body[field]!==undefined)address[field]=req.body[field]}); if(req.body.isDefault)user.addresses.forEach((item)=>{item.isDefault=item._id.equals(address._id)}); await user.save(); res.json({message:'تم تحديث العنوان',addresses:user.addresses}); } catch(err){next(err)} };
exports.deleteAddress = async (req, res, next) => { try { const user=await User.findById(req.user._id); if(!user)return res.status(404).json({message:'الحساب غير موجود'}); const address=user.addresses.id(req.params.addressId); if(!address)return res.status(404).json({message:'العنوان غير موجود'}); const wasDefault=address.isDefault; user.addresses.pull(req.params.addressId); if(wasDefault&&user.addresses.length)user.addresses[0].isDefault=true; await user.save(); res.json({message:'تم حذف العنوان',addresses:user.addresses}); } catch(err){next(err)} };
exports.setDefaultAddress = async (req, res, next) => { try { const user=await User.findById(req.user._id); const address=user?.addresses.id(req.params.addressId); if(!address)return res.status(404).json({message:'العنوان غير موجود'}); user.addresses.forEach((item)=>{item.isDefault=item._id.equals(address._id)}); await user.save(); res.json({message:'تم تعيين العنوان الافتراضي',addresses:user.addresses}); } catch(err){next(err)} };
