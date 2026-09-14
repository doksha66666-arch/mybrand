const User = require('../models/User');

async function ensurePhoneUniqueIndex() {
  const duplicateGroups = await User.aggregate([
    { $match: { phone: { $exists: true, $type: 'string', $ne: '' } } },
    { $group: { _id: '$phone', users: { $push: { id: '$_id', createdAt: '$createdAt' } }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 100 },
  ]);

  let clearedDuplicatePhones = 0;
  for (const group of duplicateGroups) {
    const users = [...group.users].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime || String(a.id).localeCompare(String(b.id));
    });

    // Keep the phone on the oldest account and clear it from later duplicate accounts.
    // This preserves one valid owner and lets those accounts add a new unique phone later.
    const duplicateIds = users.slice(1).map((user) => user.id);
    if (duplicateIds.length) {
      const result = await User.updateMany(
        { _id: { $in: duplicateIds }, phone: group._id },
        { $unset: { phone: 1 } }
      );
      clearedDuplicatePhones += result.modifiedCount || 0;
    }
  }

  // Empty strings are values to a unique index, so remove them as well.
  await User.updateMany(
    { phone: { $exists: true, $type: 'string', $eq: '' } },
    { $unset: { phone: 1 } }
  );

  const indexes = await User.collection.indexes();
  const phoneIndex = indexes.find((index) => index.name === 'phone_1');

  if (phoneIndex && phoneIndex.unique === true) {
    console.log(`Unique phone index verified. Cleared ${clearedDuplicatePhones} duplicate phone value(s).`);
    return true;
  }

  if (phoneIndex) await User.collection.dropIndex('phone_1');
  await User.collection.createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'phone_1' });
  console.log(`Unique phone index created. Cleared ${clearedDuplicatePhones} duplicate phone value(s).`);
  return true;
}

module.exports = { ensurePhoneUniqueIndex };
