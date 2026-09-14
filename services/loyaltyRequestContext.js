const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function loyaltyOrderContext(req, _res, next) {
  const requestedPoints = Math.max(0, Math.floor(Number(req.body?.loyaltyPoints || 0)));
  storage.run({ requestedPoints }, next);
}

module.exports = { storage, loyaltyOrderContext };
