const Offer = require('../models/Offer');

// يرجّع كل العروض المفعّلة والسارية حاليًا (بين تاريخ البداية والنهاية) والمطابقة لنطاق منتج معيّن
const getMatchingOffers = async ({ productId, categoryId, merchantId }) => {
  const now = new Date();
  const scopeConditions = [{ scope: 'store' }];
  if (categoryId) scopeConditions.push({ scope: 'category', targetCategory: categoryId });
  if (merchantId) scopeConditions.push({ scope: 'merchant', targetMerchant: merchantId });
  if (productId) scopeConditions.push({ scope: 'product', targetProduct: productId });

  return Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: scopeConditions,
  });
};

const calcDiscountAmount = (price, offer) => {
  let discount = offer.discountType === 'percentage' ? (price * offer.discountValue) / 100 : offer.discountValue;
  if (offer.maxDiscountAmount != null) discount = Math.min(discount, offer.maxDiscountAmount);
  discount = Math.min(discount, price); // الخصم لا يتجاوز سعر المنتج نفسه أبدًا
  return Math.round(discount * 100) / 100;
}

// يحسب السعر الفعلي لمنتج واحد بعد تطبيق أفضل عرض متاح له (منتج/قسم/تاجر - وليس عروض "المتجر كله" المشروطة بحد أدنى للطلب،
// لأن هذه تُحسب على مستوى السلة كاملة وليس على مستوى منتج منفرد - راجع applyStoreWideOffer أدناه)
const getEffectivePrice = async (product) => {
  const offers = await getMatchingOffers({
    productId: product._id,
    categoryId: product.category?._id || product.category,
    merchantId: product.merchant?._id || product.merchant || null,
  });

  // عروض "المتجر كله" لا تُطبَّق هنا لأنها مشروطة بحد أدنى لقيمة السلة كاملة، تُحسب لاحقًا عند إنشاء الطلب
  const perProductOffers = offers.filter((o) => o.scope !== 'store');

  let bestOffer = null;
  let bestDiscount = 0;
  for (const offer of perProductOffers) {
    const discount = calcDiscountAmount(product.price, offer);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestOffer = offer;
    }
  }

  return {
    originalPrice: product.price,
    finalPrice: Math.round((product.price - bestDiscount) * 100) / 100,
    discountAmount: bestDiscount,
    appliedOffer: bestOffer
      ? { id: bestOffer._id, nameAr: bestOffer.nameAr, discountType: bestOffer.discountType, discountValue: bestOffer.discountValue }
      : null,
  };
};

// يطبَّق مرة واحدة على مستوى السلة كاملة (بعد حساب أسعار كل العناصر) - يبحث عن أفضل عرض "متجر كامل" يستوفي الحد الأدنى للطلب
const applyStoreWideOffer = async (subtotal) => {
  const storeOffers = await getMatchingOffers({});
  const eligible = storeOffers.filter((o) => o.scope === 'store' && subtotal >= (o.minOrderAmount || 0));

  let bestOffer = null;
  let bestDiscount = 0;
  for (const offer of eligible) {
    const discount = calcDiscountAmount(subtotal, offer);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestOffer = offer;
    }
  }

  return {
    discountAmount: bestDiscount,
    appliedOffer: bestOffer
      ? { id: bestOffer._id, nameAr: bestOffer.nameAr, discountType: bestOffer.discountType, discountValue: bestOffer.discountValue }
      : null,
  };
};

// يضيف حقول السعر بعد الخصم لمصفوفة منتجات (أو مستند واحد داخل مصفوفة) - بدون كشف أي بيانات عمولة
const attachPricing = async (products) => {
  const plain = products.map((p) => (p.toObject ? p.toObject() : p));
  return Promise.all(
    plain.map(async (p) => {
      const pricing = await getEffectivePrice(p);
      return {
        ...p,
        finalPrice: pricing.finalPrice,
        discountAmount: pricing.discountAmount,
        appliedOffer: pricing.appliedOffer,
      };
    })
  );
};

module.exports = { getEffectivePrice, applyStoreWideOffer, calcDiscountAmount, getMatchingOffers, attachPricing };
