// Prevent clients from impersonating another customer when creating an order.
// The server remains the source of truth for the customer identity on the order.
module.exports = (req, res, next) => {
  req.body = req.body || {};
  req.body.customer = {
    ...(req.body.customer || {}),
    name: req.user?.name || '',
    email: req.user?.email || '',
    phone: req.user?.phone || '',
  };
  next();
};
