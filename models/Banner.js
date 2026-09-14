const mongoose = require('mongoose');

const BANNER_PLACEMENTS = [
  'home', 'products', 'product', 'account', 'categories', 'trend',
  'new-arrivals', 'offers', 'sale',
];

const bannerSchema = new mongoose.Schema(
  {
    titleAr: { type: String, required: true, trim: true },
    subtitleAr: { type: String, default: '' },
    image: { type: String, required: true },
    buttonTextAr: { type: String, default: '' },
    buttonLink: { type: String, default: '' },
    placements: {
      type: [{ type: String, enum: BANNER_PLACEMENTS }],
      default: ['home'],
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.statics.PLACEMENTS = BANNER_PLACEMENTS;

module.exports = mongoose.model('Banner', bannerSchema);
