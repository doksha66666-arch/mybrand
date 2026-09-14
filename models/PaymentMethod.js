const mongoose = require('mongoose');

// حقل بيانات مطلوب من العميل وقت الدفع (مثال: رقم الهاتف الذي حوّل منه)
const requiredFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true }, // اسم الحقل تقنيًا، مثال: senderPhone
    labelAr: { type: String, required: true }, // النص الظاهر للعميل
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const paymentMethodSchema = new mongoose.Schema(
  {
    // معرّف ثابت يُستخدم كقيمة لحقل paymentMethod في نموذج الطلب - لا يتغيّر بعد الإنشاء
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },

    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },

    // cod = دفع عند الاستلام (بدون بيانات إضافية)
    // manual_transfer = تحويل يدوي يراجعه الأدمن (فودافون كاش، تحويل بنكي...)
    // gateway = بوابة دفع إلكترونية حقيقية (محجوزة للمستقبل - لا تُفعَّل فعليًا بدون مفاتيح API صحيحة)
    type: { type: String, enum: ['cod', 'manual_transfer', 'gateway'], default: 'manual_transfer' },

    descriptionAr: { type: String, default: '' },
    instructionsAr: { type: String, default: '' }, // مثال: "حوّل المبلغ إلى الرقم التالي ثم أدخل رقم هاتفك"

    // القيمة الظاهرة للعميل (رقم محفظة، رقم حساب بنكي...) - فارغة لطرق مثل COD
    displayValue: { type: String, default: '' },

    // بيانات يجب على العميل إدخالها وقت اختيار طريقة الدفع هذه
    requiredFields: [requiredFieldSchema],

    // إعدادات داخلية للأدمن فقط (مثال: مفاتيح بوابة دفع مستقبلية) - لا تُعرض أبدًا في الـ API العام
    internalConfig: { type: mongoose.Schema.Types.Mixed, default: {} },

    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
