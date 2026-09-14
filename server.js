require('dotenv').config();

const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

const { isCloudinaryConfigured } = require('./config/cloudinary');
if (process.env.NODE_ENV === 'production' && !isCloudinaryConfigured) {
  console.error('Cloudinary is required in production for persistent media storage.');
  process.exit(1);
}

const app = require('./app');
const connectDB = require('./config/db');
const { ensureDefaultCategories } = require('./scripts/ensureDefaultCategories');
const { ensurePhoneUniqueIndex } = require('./scripts/ensurePhoneUniqueIndex');
const { ensureCloudinaryMediaOnly } = require('./scripts/ensureCloudinaryMediaOnly');
const { startDailyOrderArchiveScheduler } = require('./services/dailyOrderArchiveScheduler');

const PORT = Number(process.env.PORT) || 5000;

connectDB().then(async () => {
  try {
    await ensurePhoneUniqueIndex();
  } catch (error) {
    console.error('Phone index bootstrap failed:', error.message);
  }

  try {
    await ensureDefaultCategories();
    console.log('Default storefront categories verified.');
  } catch (error) {
    console.error('Category bootstrap failed:', error.message);
  }

  try {
    await ensureCloudinaryMediaOnly();
  } catch (error) {
    console.error('Cloudinary media cleanup failed:', error.message);
  }

  startDailyOrderArchiveScheduler();
  app.listen(PORT, '0.0.0.0', () => console.log(`MYBRAND API running on port ${PORT}`));
});
