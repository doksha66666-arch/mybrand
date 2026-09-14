// إعدادات عامة غير حساسة يحتاجها التطبيق والمعروضة للعميل (رقم الدفع، إلخ)
exports.getPublicConfig = async (req, res) => {
  res.json({
    vodafoneCashNumber: process.env.MERCHANT_VODAFONE_CASH_NUMBER || '',
    paymentMethods: {
      cod: true,
      vodafoneCash: Boolean(process.env.MERCHANT_VODAFONE_CASH_NUMBER),
    },
  });
};
