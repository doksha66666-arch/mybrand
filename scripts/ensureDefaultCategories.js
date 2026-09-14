const Category = require('../models/Category');

// Storefront categories: stable slugs + curated images.
// Existing custom category images are preserved; missing images are filled automatically.
const DEFAULT_CATEGORIES = [
  { nameAr: 'نساء', nameEn: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=82', sortOrder: 10 },
  { nameAr: 'رجال', nameEn: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=82', sortOrder: 20 },
  { nameAr: 'أطفال', nameEn: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=800&q=82', sortOrder: 30 },
  { nameAr: 'مقاسات كبيرة', nameEn: 'Plus Size', slug: 'plus-size', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=82', sortOrder: 40 },
  { nameAr: 'ملابس داخلية', nameEn: 'Lingerie & Underwear', slug: 'underwear', image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=800&q=82', sortOrder: 50 },
  { nameAr: 'أحذية', nameEn: 'Shoes', slug: 'shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=82', sortOrder: 60 },
  { nameAr: 'حقائب وأمتعة', nameEn: 'Bags & Luggage', slug: 'bags', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=82', sortOrder: 70 },
  { nameAr: 'مجوهرات وإكسسوارات', nameEn: 'Jewelry & Accessories', slug: 'jewelry-accessories', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=82', sortOrder: 80 },
  { nameAr: 'الجمال والصحة', nameEn: 'Beauty & Health', slug: 'beauty-health', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=82', sortOrder: 90 },
  { nameAr: 'المنزل والمعيشة', nameEn: 'Home & Living', slug: 'home-living', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=82', sortOrder: 100 },
  { nameAr: 'الرياضة والأنشطة', nameEn: 'Sports & Activities', slug: 'sports', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=82', sortOrder: 110 },
  { nameAr: 'إلكترونيات وموبايلات', nameEn: 'Electronics & Phones', slug: 'electronics', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=82', sortOrder: 120 },
  { nameAr: 'ألعاب', nameEn: 'Toys & Games', slug: 'toys', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=82', sortOrder: 130 },
  { nameAr: 'كتب وقرطاسية', nameEn: 'Books & Stationery', slug: 'books', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=82', sortOrder: 140 },
  { nameAr: 'سيارات ومستلزمات', nameEn: 'Automotive', slug: 'automotive', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=82', sortOrder: 150 },
  { nameAr: 'حيوانات أليفة', nameEn: 'Pets', slug: 'pets', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=82', sortOrder: 160 },
  { nameAr: 'البقالة والطعام', nameEn: 'Grocery & Food', slug: 'grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=82', sortOrder: 170 },
  { nameAr: 'هدايا ومناسبات', nameEn: 'Gifts & Occasions', slug: 'gifts', image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=82', sortOrder: 180 },
];

async function ensureDefaultCategories() {
  for (const item of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ slug: item.slug });
    if (!existing) {
      await Category.create({ ...item, isActive: true });
      continue;
    }

    const patch = {};
    if (!existing.image) patch.image = item.image;
    if (!existing.nameEn) patch.nameEn = item.nameEn;
    if (!existing.isActive) patch.isActive = true;
    if (existing.sortOrder === undefined || existing.sortOrder === null) patch.sortOrder = item.sortOrder;
    if (Object.keys(patch).length) await Category.updateOne({ _id: existing._id }, { $set: patch });
  }
}

module.exports = { ensureDefaultCategories, DEFAULT_CATEGORIES };
