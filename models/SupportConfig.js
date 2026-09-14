const mongoose = require('mongoose');

const supportConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  title: { type: String, default: 'خدمة العملاء' },
  subtitle: { type: String, default: 'نحن معك في كل خطوة من الطلب حتى الاستلام.' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  email: { type: String, default: '' },
  hours: { type: String, default: 'يوميًا من 10 صباحًا حتى 10 مساءً' },
  responseTime: { type: String, default: 'الرد عادة خلال دقائق' },
}, { timestamps: true });

module.exports = mongoose.model('SupportConfig', supportConfigSchema);
