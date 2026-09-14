// Merchant responses are fulfillment-only. Keep a strict allowlist so customer/payment fields cannot leak through future endpoints.
module.exports = (req, res, next) => {
  const originalJson = res.json.bind(res);
  const sanitizeItem = (item) => {
    if (!item || typeof item !== 'object') return null;
    return {
      name: item.name || item.nameSnapshot || 'منتج',
      image: item.image || item.imageSnapshot || '',
      color: item.color || '',
      size: item.size || '',
      options: item.options && typeof item.options === 'object' && !Array.isArray(item.options) ? item.options : {},
      quantity: Number(item.quantity || 0),
      productCode: item.productCode || item.productCodeSnapshot || '',
      notes: item.notes || item.notesSnapshot || '',
    };
  };
  const sanitizeOrder = (order) => {
    if (!order || typeof order !== 'object') return order;
    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      merchantStatus: order.merchantStatus,
      createdAt: order.createdAt,
      items: Array.isArray(order.items) ? order.items.map(sanitizeItem).filter(Boolean) : [],
    };
  };
  res.json = (payload) => {
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.orders)) payload = { orders: payload.orders.map(sanitizeOrder) };
      else if (payload.order) payload = { order: sanitizeOrder(payload.order) };
      else if (payload.orderId || payload.orderNumber || payload.merchantStatus) payload = {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        merchantStatus: payload.merchantStatus,
      };
    }
    return originalJson(payload);
  };
  next();
};
