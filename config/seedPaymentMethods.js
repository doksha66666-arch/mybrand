const PaymentMethod = require('../models/PaymentMethod');

// يشتغل مرة واحدة عند بدء تشغيل الخادم - ينشئ طرق الدفع الافتراضية فقط لو مش موجودة أصلًا
// بهذا نضمن أن "الدفع عند الاستلام" و"فودافون كاش" يفضلوا شغّالين بدون أي تدخل يدوي من الأدمن بعد هذا التحديث
const seedPaymentMethods = async () => {
  const existingCount = await PaymentMethod.countDocuments({});
  if (existingCount > 0) return; // موجودين بالفعل (تشغيلة سابقة) - لا تكرر الإنشاء

  const vodafoneNumber = process.env.MERCHANT_VODAFONE_CASH_NUMBER || '';

  await PaymentMethod.insertMany([
    {
      key: 'cod',
      nameAr: 'الدفع عند الاستلام',
      nameEn: 'Cash on Delivery',
      type: 'cod',
      descriptionAr: 'ادفع نقدًا عند استلام طلبك',
      instructionsAr: '',
      displayValue: '',
      requiredFields: [],
      isActive: true,
      sortOrder: 1,
    },
    {
      key: 'vodafone_cash',
      nameAr: 'فودافون كاش',
      nameEn: 'Vodafone Cash',
      type: 'manual_transfer',
      descriptionAr: 'حوّل المبلغ عبر فودافون كاش وسنراجع طلبك يدويًا',
      instructionsAr: 'حوّل المبلغ إلى الرقم التالي، ثم أدخل رقم الهاتف الذي حوّلت منه (ورقم العملية إن وُجد)',
      displayValue: vodafoneNumber,
      requiredFields: [
        { key: 'senderPhone', labelAr: 'رقم الهاتف الذي حوّلت منه', required: true },
        { key: 'transactionRef', labelAr: 'رقم العملية (اختياري)', required: false },
      ],
      isActive: Boolean(vodafoneNumber), // لو الرقم مش متوفر في .env، تُنشأ الطريقة معطّلة حتى يفعّلها الأدمن يدويًا
      sortOrder: 2,
    },
  ]);

  console.log('تم تجهيز طرق الدفع الافتراضية (COD + فودافون كاش)');
};

module.exports = seedPaymentMethods;
