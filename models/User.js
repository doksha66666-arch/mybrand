const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({ label: { type: String, default: 'Home' }, fullName: String, phone: String, country: String, governorate: String, center: String, city: String, street: String, building: String, notes: String, isDefault: { type: Boolean, default: false } }, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: false, unique: true, sparse: true, lowercase: true, trim: true }, phone: { type: String, trim: true, unique: true, sparse: true }, country: { type: String, trim: true, default: 'مصر' }, governorate: { type: String, trim: true }, center: { type: String, trim: true }, city: { type: String, trim: true }, street: { type: String, trim: true }, building: String, notes: String, password: { type: String, required: true, minlength: 6, select: false }, role: { type: String, enum: ['customer', 'merchant', 'admin'], default: 'customer' }, addresses: [addressSchema], earnedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }], giftCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GiftCard' }], giftBalance: { type: Number, default: 0, min: 0 }, points: { type: Number, default: 0, min: 0 }, isActive: { type: Boolean, default: true }, preferredLanguage: { type: String, enum: ['ar', 'en'], default: 'ar' },
  isEmailVerified: { type: Boolean, default: true },
  emailVerificationCode: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  googleId: { type: String, unique: true, sparse: true, select: false },
  facebookId: { type: String, unique: true, sparse: true, select: false },
}, { timestamps: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });
userSchema.pre('save', async function (next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = function (candidate) { return bcrypt.compare(candidate, this.password); };
module.exports = mongoose.model('User', userSchema);
