const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Category = require('../models/Category');
const Campaign = require('../models/Campaign');
const TrendPost = require('../models/TrendPost');
const TrendEvent = require('../models/TrendEvent');

const LOCAL_MEDIA_RE = /(^|\/)uploads\//i;
const isLegacyLocal = (value) => typeof value === 'string' && LOCAL_MEDIA_RE.test(value.trim());
const cleanArray = (values) => (Array.isArray(values) ? values.filter((value) => !isLegacyLocal(value)) : values);

async function ensureCloudinaryMediaOnly() {
  const result = { products: 0, banners: 0, categories: 0, campaigns: 0, trendPosts: 0, trendEventsHidden: 0 };

  const products = await Product.find({
    $or: [
      { images: { $elemMatch: { $regex: LOCAL_MEDIA_RE } } },
      { videoUrl: { $regex: LOCAL_MEDIA_RE } },
      { videoPoster: { $regex: LOCAL_MEDIA_RE } },
    ],
  }).select('_id images videoUrl videoPoster').lean();
  for (const product of products) {
    const update = {};
    const images = cleanArray(product.images);
    if (JSON.stringify(images) !== JSON.stringify(product.images)) update.images = images;
    if (isLegacyLocal(product.videoUrl)) update.videoUrl = '';
    if (isLegacyLocal(product.videoPoster)) update.videoPoster = '';
    if (Object.keys(update).length) {
      await Product.updateOne({ _id: product._id }, { $set: update });
      result.products += 1;
    }
  }

  for (const Model of [Banner, Category]) {
    const docs = await Model.find({ image: { $regex: LOCAL_MEDIA_RE } }).select('_id image').lean();
    for (const doc of docs) {
      await Model.updateOne({ _id: doc._id }, { $set: { image: '' } });
      result[Model === Banner ? 'banners' : 'categories'] += 1;
    }
  }

  const campaigns = await Campaign.find({
    $or: [{ image: { $regex: LOCAL_MEDIA_RE } }, { bannerImage: { $regex: LOCAL_MEDIA_RE } }],
  }).select('_id image bannerImage').lean();
  for (const campaign of campaigns) {
    const update = {};
    if (isLegacyLocal(campaign.image)) update.image = '';
    if (isLegacyLocal(campaign.bannerImage)) update.bannerImage = '';
    if (Object.keys(update).length) {
      await Campaign.updateOne({ _id: campaign._id }, { $set: update });
      result.campaigns += 1;
    }
  }

  const trendPosts = await TrendPost.find({
    $or: [{ image: { $regex: LOCAL_MEDIA_RE } }, { videoUrl: { $regex: LOCAL_MEDIA_RE } }],
  }).select('_id image videoUrl isPublished').lean();
  for (const post of trendPosts) {
    const update = {};
    if (isLegacyLocal(post.image)) update.image = '';
    if (isLegacyLocal(post.videoUrl)) update.videoUrl = '';
    if (!update.image && !update.videoUrl) update.isPublished = false;
    if (Object.keys(update).length) {
      await TrendPost.updateOne({ _id: post._id }, { $set: update });
      result.trendPosts += 1;
    }
  }

  const trendEvents = await TrendEvent.find({ image: { $regex: LOCAL_MEDIA_RE } }).select('_id').lean();
  if (trendEvents.length) {
    await TrendEvent.updateMany({ _id: { $in: trendEvents.map((event) => event._id) } }, { $set: { isPublished: false } });
    result.trendEventsHidden = trendEvents.length;
  }

  console.log('Cloudinary media policy applied:', result);
  return result;
}

module.exports = { ensureCloudinaryMediaOnly };