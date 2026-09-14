# MYBRAND — دليل التشغيل والنشر الكامل

المشروع يتكوّن من 5 أجزاء منفصلة:

```
mybrand-app/
├── backend/               → Node.js + Express + MongoDB (API)
├── mobile/                → تطبيق Expo React Native (Android + iOS)
├── web/                   → موقع ويب (React + Vite) بنفس وظائف التطبيق
├── admin-dashboard/       → لوحة تحكم الأدمن (React)
└── merchant-dashboard/    → لوحة تحكم التاجر (React)
```

**ملاحظة مهمة:** لا يحتوي المشروع حاليًا على أي منتجات أو أقسام أو بيانات تجريبية، كما طُلب. كل الشاشات جاهزة وتعرض حالة "فارغة" حتى تبدأ بإضافة البيانات الحقيقية عبر لوحة التحكم.

## تشغيل سريع (Quick Start)

الترتيب الإلزامي: **شغّل الـ Backend دايمًا الأول** — كل الواجهات (موقع، موبايل، لوحة تحكم) متصلة بيه ومش هتشتغل من غيره.

1. `backend` → `npm install` → `cp .env.example .env` → `npm run dev`
2. `backend` → `node scripts/createAdmin.js` (ينشئ حساب الأدمن)
3. `admin-dashboard` → `npm install` → `cp .env.example .env` → `npm run dev` → سجّل دخول وأضف قسم ومنتج
4. `web` (أو `mobile`) → `npm install` → `cp .env.example .env` → `npm run dev` (أو `npx expo start`)

تفاصيل كل خطوة بالأسفل.

---

## 1) تشغيل الـ Backend

### المتطلبات
- Node.js 18+
- قاعدة بيانات MongoDB — الأسهل محليًا عبر Docker (أمر واحد، بدون تثبيت):
```bash
docker run -d --name mybrand-mongo -p 27017:27017 mongo:7
```
أو استخدم [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (نسخة سحابية مجانية، بدون Docker).

### الخطوات
```bash
cd backend
npm install
cp .env.example .env
# افتح .env وعدّل القيم:
# - MONGO_URI برابط قاعدة بياناتك
# - JWT_SECRET بقيمة عشوائية طويلة وسرية (لا تستخدم القيمة الافتراضية في الإنتاج)
# - MERCHANT_VODAFONE_CASH_NUMBER برقمك الفعلي لاستقبال تحويلات فودافون كاش

npm run dev
```
سيعمل الـ API على: `http://localhost:5000/api`

### إنشاء أول حساب Admin
```bash
# داخل مجلد backend
ADMIN_EMAIL=your-admin@example.com ADMIN_PASSWORD=YourStrongPassword123! node scripts/createAdmin.js
```
غيّر كلمة المرور فور أول دخول.

### نشر الـ Backend (اختر إحدى الخيارات)
- **Render / Railway**: اربط المستودع، أضف متغيرات البيئة من `.env`، وحدد `npm start` كأمر تشغيل.
- **VPS خاص**: استخدم PM2 لإدارة العملية: `pm2 start server.js --name mybrand-api`
- **MongoDB Atlas**: أنشئ Cluster مجاني، وانسخ رابط الاتصال في `MONGO_URI`.

⚠️ لا تضع مفاتيح `.env` في أي مستودع Git عام — الملف `.gitignore` يستثنيه تلقائيًا.

---

## 2) تشغيل تطبيق الموبايل (Expo)

### المتطلبات
- Node.js 18+
- تطبيق **Expo Go** على جوالك (لتجربة سريعة)، أو Android Studio / Xcode لمحاكيات كاملة

### الخطوات
```bash
cd mobile
npm install
```

في ملف `app.json`، عدّل:
```json
"extra": { "apiBaseUrl": "https://YOUR-DEPLOYED-BACKEND.com/api" }
```
(أو اتركه على `http://localhost:5000/api` أثناء التطوير المحلي فقط، مع استخدام IP جهازك بدلاً من localhost إذا كنت تختبر على جهاز حقيقي)

```bash
npx expo start
```
امسح رمز QR بتطبيق Expo Go لتشغيل التطبيق فورًا على جوالك.

### بناء نسخة Android (APK/AAB) للنشر على Google Play

1. أنشئ حساب مجاني على [expo.dev](https://expo.dev) وثبّت أداة EAS:
```bash
npm install -g eas-cli
eas login
```
2. من داخل مجلد `mobile`:
```bash
eas build:configure
eas build --platform android --profile production
```
3. بعد اكتمال البناء (سحابيًا)، ستحصل على رابط تحميل ملف `.aab` جاهز للرفع.
4. أنشئ حساب مطوّر على [Google Play Console](https://play.google.com/console) (رسوم اشتراك لمرة واحدة)، وارفع ملف `.aab` هناك.

### بناء نسخة iOS للنشر على App Store

1. تحتاج حساب [Apple Developer Program](https://developer.apple.com/programs/) (اشتراك سنوي مدفوع) — هذا شرط من Apple نفسها ولا بديل عنه.
2. من داخل مجلد `mobile`:
```bash
eas build --platform ios --profile production
```
3. اتبع تعليمات EAS لربط حساب Apple الخاص بك (سيطلب منك بيانات Apple Developer).
4. بعد اكتمال البناء، ارفعه عبر:
```bash
eas submit --platform ios
```
5. أكمل بيانات التطبيق (الوصف، الصور، السياسات) على [App Store Connect](https://appstoreconnect.apple.com).

> ملاحظة: بناء iOS يتطلب حساب Apple Developer فعّال بغض النظر عن الأداة المستخدمة — هذا شرط من Apple.

---

## 3) تشغيل الموقع (Web Storefront)

نسخة ويب كاملة بنفس وظائف تطبيق الموبايل (بحث، سلة، فودافون كاش، إلخ)، متصلة بنفس الـ Backend.

```bash
cd web
npm install
cp .env.example .env
# عدّل VITE_API_BASE_URL ليشير لرابط الـ Backend الفعلي عند النشر
npm run dev
```
سيعمل الموقع على: `http://localhost:5174`

### نشر الموقع
```bash
npm run build
```
ثم ارفع محتوى مجلد `dist/` إلى Vercel أو Netlify أو Cloudflare Pages (نفس طريقة نشر لوحة التحكم).

---

## 4) تشغيل لوحة التحكم (Admin Dashboard)

```bash
cd admin-dashboard
npm install
cp .env.example .env
# عدّل VITE_API_BASE_URL ليشير لرابط الـ Backend الفعلي عند النشر
npm run dev
```
ستعمل لوحة التحكم على: `http://localhost:5173`

سجّل الدخول بحساب الـ Admin الذي أنشأته في الخطوة السابقة، ثم ابدأ بإضافة الأقسام أولًا، ثم المنتجات.

### نشر لوحة التحكم
```bash
npm run build
```
ثم ارفع محتوى مجلد `dist/` إلى أي استضافة استاتيكية (Vercel, Netlify, Cloudflare Pages...).

### إعداد رفع الصور (Cloudinary)

1. أنشئ حسابًا مجانيًا على [cloudinary.com](https://cloudinary.com).
2. من الـ Dashboard، انسخ: Cloud Name, API Key, API Secret.
3. أضفهم في `backend/.env`:
```
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```
4. إذا تركتها فارغة أثناء التطوير، سيحفظ النظام الصور محليًا تلقائيًا في `backend/uploads` — هذا مناسب للتجربة فقط، وليس للنشر الفعلي (الملفات قد تُفقد عند إعادة نشر الخادم على استضافات مثل Render).
5. من لوحة التحكم → صفحة المنتجات، اضغط "أضف صورة" وارفع الصور مباشرة بدل لصق روابط يدويًا.

---

## 5) تشغيل لوحة التاجر (Merchant Dashboard)

لوحة مستقلة لأصحاب المتاجر داخل المنصة — تسجيل، بروفايل، منتجات، طلبات، مبيعات، عمولة.

```bash
cd merchant-dashboard
npm install
cp .env.example .env
npm run dev
```
ستعمل على: `http://localhost:5175`

أول مرة: افتح `http://localhost:5175/register` وسجّل حساب تاجر تجريبي، ثم من لوحة الأدمن (`/merchants`) وافق عليه حتى يقدر يضيف منتجات.

---

## 6) الأمان — قبل الإطلاق الفعلي

- [ ] غيّر جميع القيم في `.env` (JWT secrets) بقيم عشوائية قوية.
- [ ] فعّل HTTPS على الـ Backend (عبر مزود الاستضافة أو Let's Encrypt).
- [ ] راجع صلاحيات `adminOnly` على كل مسارات لوحة التحكم (موجودة بالفعل في الكود).
- [ ] فعّل نسخ احتياطي دوري لقاعدة بيانات MongoDB.
- [ ] عند إضافة الدفع الإلكتروني مستقبلًا، لا تخزّن بيانات البطاقات بنفسك؛ استخدم مزودًا معتمدًا (Stripe, Paymob, Fawry...) والتزم بمعيار PCI-DSS.

---

## 7) الخطوات التالية المقترحة

1. إضافة الأقسام عبر لوحة التحكم.
2. إضافة أول دفعة منتجات حقيقية.
3. اختبار السلة والـ Checkout كاملًا بمنتج حقيقي.
4. فودافون كاش مُفعّل بالفعل (مراجعة يدوية من لوحة التحكم) — لربط بوابة دفع آلية بالكامل مستقبلًا (بطاقات، Instapay...)، الحقل `paymentMethod` في نموذج الطلب جاهز للتوسع بقيم جديدة.
5. طلب مراجعة Google Play / App Store (كل متجر لديه إرشادات مراجعة يجب اتباعها).


## نشر المشروع على Railway — الإعداد الصحيح

المشروع يحتوي على 4 خدمات يمكن نشرها بشكل منفصل: `backend`, `web`, `admin-dashboard`, `merchant-dashboard`.

### Backend
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- المتغيرات المطلوبة: `MONGO_URI`, `JWT_SECRET`
- `ALLOWED_ORIGINS`: ضع روابط `web` و`admin-dashboard` و`merchant-dashboard` الفعلية مفصولة بفواصل.

### Web / Admin / Merchant Dashboard
لكل خدمة:
- Root Directory: مجلد الخدمة نفسه.
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Railway يحدد `PORT` تلقائيًا، وملفات `vite.config.js` أصبحت تستخدمه بدل المنافذ الثابتة.
- `VITE_API_BASE_URL` يجب أن يشير إلى رابط خدمة الـ Backend وينتهي بـ `/api`.
- في `web` يجب ضبط `VITE_MERCHANT_DASHBOARD_URL` على رابط لوحة التاجر.

### مشكلة "Blocked request. This host ... is not allowed"
تم إصلاحها في الخدمات الثلاث: Vite يستمع على `0.0.0.0` ويسمح بنطاقات Railway (`*.up.railway.app`) بالإضافة إلى `RAILWAY_PUBLIC_DOMAIN`.

### مهم
لا تستخدم `localhost` في متغيرات `VITE_API_BASE_URL` على Railway. متغيرات `VITE_*` تُدمج وقت `npm run build`، لذلك يجب إضافتها قبل الـ Deploy/Rebuild.

