const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const pickIntent = (message = '') => {
  const text = String(message).toLowerCase();
  if (text.includes('أكثر') && (text.includes('بيع') || text.includes('مبيع'))) return 'top_products';
  if (text.includes('منتج') && (text.includes('حركة') || text.includes('ضعيف') || text.includes('الأقل'))) return 'slow_products';
  if (text.includes('عميل') && (text.includes('غير نشط') || text.includes('نشط') || text.includes('قيمة'))) return 'customers';
  if (text.includes('طلب') && (text.includes('متأخر') || text.includes('إلغاء') || text.includes('حالي'))) return 'orders';
  if (text.includes('مبيعات') || text.includes('إيراد') || text.includes('أداء المتجر') || text.includes('اليوم')) return 'store';
  return null;
};

const buildData = async (intent) => {
  const detailPromise = intent === 'top_products' || intent === 'slow_products'
    ? Order.aggregate([
        { $match: { status: { $nin: ['cancelled'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.nameSnapshot' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: intent === 'top_products' ? { quantity: -1 } : { quantity: 1 } },
        { $limit: 10 },
      ])
    : intent === 'customers'
      ? Order.aggregate([
          { $match: { status: { $nin: ['cancelled'] } } },
          {
            $group: {
              _id: '$user',
              orders: { $sum: 1 },
              spent: { $sum: '$total' },
              lastOrder: { $max: '$placedAt' },
            },
          },
          { $sort: { spent: -1 } },
          { $limit: 10 },
        ])
      : intent === 'orders'
        ? Order.find({ status: { $in: ['pending', 'confirmed', 'processing'] } })
            .sort({ placedAt: 1 })
            .limit(10)
            .select('orderNumber status total placedAt customer.name customer.email')
        : Promise.resolve(null);

  const [baseResult, detailResult] = await Promise.all([
    Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } }]),
      User.countDocuments({ role: 'customer', isActive: true }),
    ]),
    detailPromise,
  ]);

  const [productCount, activeProducts, orderStats, customerCount] = baseResult;
  const base = {
    intent,
    generatedAt: new Date().toISOString(),
    products: { total: productCount, active: activeProducts },
    customers: { active: customerCount },
    orders: orderStats.reduce((acc, row) => {
      acc[row._id] = { count: row.count, revenue: Number(row.revenue || 0) };
      return acc;
    }, {}),
  };

  if (intent === 'top_products' || intent === 'slow_products') {
    base.products.ranking = detailResult || [];
  }

  if (intent === 'customers') {
    base.customers.ranking = detailResult || [];
  }

  if (intent === 'orders') {
    base.orders.attention = detailResult || [];
  }

  return base;
};

const summarize = (data) => {
  const o = data.orders || {};
  const revenue = Object.values(o).reduce((sum, x) => sum + Number(x.revenue || 0), 0);
  if (data.intent === 'top_products') return `أعلى المنتجات مبيعًا حسب الكمية: ${(data.products.ranking || []).slice(0, 5).map((x, i) => `${i + 1}) ${x.name || 'منتج'} — ${x.quantity} قطعة`).join('، ') || 'لا توجد بيانات مبيعات كافية.'}`;
  if (data.intent === 'slow_products') return `أقل المنتجات حركة ضمن آخر البيانات المتاحة: ${(data.products.ranking || []).slice(0, 5).map(x => `${x.name || 'منتج'} — ${x.quantity} قطعة`).join('، ') || 'لا توجد بيانات مبيعات كافية.'}`;
  if (data.intent === 'customers') return `أعلى العملاء إنفاقًا: ${(data.customers.ranking || []).slice(0, 5).map(x => `${x._id} — ${Number(x.spent || 0).toFixed(2)}`).join('، ') || 'لا توجد بيانات كافية.'}`;
  if (data.intent === 'orders') return `يوجد ${(data.orders.attention || []).length} طلبات تحتاج متابعة من الحالات النشطة، وإجمالي الإيرادات المسجلة عبر الحالات ${revenue.toFixed(2)}.`;
  return `لديك ${data.products.total} منتج (${data.products.active} فعال)، و${data.customers.active} عميل نشط. إجمالي الإيرادات المسجلة عبر الطلبات ${revenue.toFixed(2)}.`;
};

async function improveWithGemini(question, data) {
  const key = String(process.env.GEMINI_API_KEY || '').trim();
  if (!key) return null;
  const model = String(process.env.GEMINI_MODEL || 'gemini-3.6-flash').trim() || 'gemini-3.6-flash';
  const body = {
    systemInstruction: {
      parts: [{ text: 'أنت محلل أعمال MYBRAND. حلل البيانات الفعلية المرفقة فقط. لا تخترع أي رقم. أجب بالعربية الطبيعية، وقدم 2-3 توصيات عملية قصيرة.' }],
    },
    contents: [{ role: 'user', parts: [{ text: JSON.stringify({ question, data }) }] }],
    generationConfig: { maxOutputTokens: 1200 },
  };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || `Gemini request failed (${response.status})`);
  return (result?.candidates || []).flatMap(c => c?.content?.parts || []).map(p => p?.text || '').join('').trim() || null;
}

exports.adminInsights = async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const intent = pickIntent(message);
  if (!intent) return res.json({ intent: null, data: null, reply: 'حدد ما تريد تحليله: المبيعات، أكثر المنتجات مبيعًا، المنتجات الأقل حركة، العملاء أو الطلبات.', mode: 'data' });

  try {
    const data = await buildData(intent);
    let reply = summarize(data);
    let mode = 'data';
    try {
      const aiReply = await improveWithGemini(message, data);
      if (aiReply) {
        reply = aiReply;
        mode = 'gemini';
      }
    } catch (error) {
      // The store remains usable even if the free Gemini quota is temporarily unavailable.
      console.error('Gemini insights:', error.message);
    }
    return res.json({ intent, data, reply, mode, aiAvailable: Boolean(process.env.GEMINI_API_KEY) });
  } catch (error) {
    console.error('Admin insights:', error);
    return res.status(500).json({ message: 'تعذر تحليل بيانات المتجر حاليًا.' });
  }
};
