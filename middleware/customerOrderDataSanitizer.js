// Defense-in-depth for customer-facing order responses.
// Customers may see their order details, but must not receive merchant
// settlement data or payment verification details. Admin responses remain
// unchanged because payment verification is an admin responsibility.
module.exports = (req, res, next) => {
  if (req.user?.role === 'admin') return next();

  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    const sanitizeOrder = (order) => {
      if (!order || typeof order !== 'object') return order;
      const clean = { ...order };

      if (Array.isArray(clean.items)) {
        clean.items = clean.items.map((item) => {
          const safeItem = { ...item };
          delete safeItem.merchant;
          delete safeItem.commissionRate;
          delete safeItem.commissionAmount;
          delete safeItem.merchantAmount;
          return safeItem;
        });
      }

      delete clean.totalCommissionAmount;
      delete clean.totalMerchantAmount;
      delete clean.vodafoneCashInfo;
      delete clean.paymentDetails;
      delete clean.cardDetails;

      return clean;
    };

    if (payload && typeof payload === 'object') {
      if (payload.order) payload = { ...payload, order: sanitizeOrder(payload.order) };
      if (Array.isArray(payload.orders)) payload = { ...payload, orders: payload.orders.map(sanitizeOrder) };
    }

    return originalJson(payload);
  };

  next();
};
