// تشغيل هذا السكريبت مرة واحدة لإنشاء حساب المشرف الأول
// الاستخدام: node scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL و ADMIN_PASSWORD مطلوبان لإنشاء حساب الأدمن');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD يجب أن تكون 12 حرفًا على الأقل');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('يوجد حساب Admin بهذا البريد بالفعل.');
    process.exit(0);
  }

  await User.create({
    name: 'MYBRAND Admin',
    email,
    password,
    role: 'admin',
  });

  console.log(`تم إنشاء حساب Admin: ${email}`);
  console.log('يرجى تغيير كلمة المرور فورًا بعد أول تسجيل دخول.');
  process.exit(0);
};

run();
