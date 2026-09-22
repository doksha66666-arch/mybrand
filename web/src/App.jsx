import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { StoreLayoutProvider } from './context/StoreLayoutContext';
import BottomNav from './components/BottomNav';
import BannerPlacement from './components/BannerPlacement';
import StorefrontMaintenanceGate from './components/StorefrontMaintenanceGate';
import HomePage from './pages/HomePage';
class StorefrontErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Storefront render error:', error);
  }

  handleReload = () => window.location.reload();

  handleHome = () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div dir="rtl" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', color: '#0f172a' }}>
        <main style={{ width: 'min(560px, 100%)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '34px 24px', textAlign: 'center', boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ width: 54, height: 54, margin: '0 auto 14px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#f1f5f9', fontSize: 26 }}>!</div>
          <h1 style={{ margin: '0 0 10px', fontSize: 24 }}>حدث خطأ غير متوقع</h1>
          <p style={{ margin: '0 auto 20px', maxWidth: 420, color: '#64748b', lineHeight: 1.8 }}>لم يتمكن المتجر من عرض الصفحة الحالية. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={this.handleReload} style={{ border: 0, borderRadius: 10, padding: '11px 16px', background: '#111827', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>إعادة المحاولة</button>
            <button type="button" onClick={this.handleHome} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '11px 16px', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>العودة للرئيسية</button>
          </div>
        </main>
      </div>
    );
  }
}

const ChunkLoadFallback = () => <div dir="rtl" style={{minHeight:'45vh',display:'grid',placeItems:'center',padding:24,color:'#64748b',textAlign:'center',gap:10}}><div><strong>تعذر تحميل الصفحة حاليًا</strong><p style={{margin:'8px 0 14px'}}>حدث تحديث للمتجر أثناء فتح الصفحة.</p><button type="button" onClick={() => window.location.reload()} style={{border:0,borderRadius:10,padding:'10px 16px',background:'#111827',color:'#fff',fontWeight:800,cursor:'pointer'}}>إعادة المحاولة</button></div></div>;
const lazyWithRetry = (importer, chunkKey) => lazy(async () => {
  const retryKey = `mybrand_chunk_retry:${chunkKey}`;
  try {
    const module = await importer();
    try { sessionStorage.removeItem(retryKey); } catch (_) {}
    return module;
  } catch (error) {
    try {
      if (typeof window !== 'undefined' && !sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, '1');
        window.location.reload();
        await new Promise(() => {});
      }
    } catch (_) {}
    return { default: ChunkLoadFallback };
  }
});
const CategoriesPage = lazyWithRetry(() => import('./pages/CategoriesPage'), 'CategoriesPage');
const SearchPage = lazyWithRetry(() => import('./pages/SearchPage'), 'SearchPage');
const NewArrivalsPage = lazyWithRetry(() => import('./pages/NewArrivalsPage'), 'NewArrivalsPage');
const OffersPage = lazyWithRetry(() => import('./pages/OffersPage'), 'OffersPage');
const ProductDetailsPage = lazyWithRetry(() => import('./pages/ProductDetailsPage'), 'ProductDetailsPage');
const CartPage = lazyWithRetry(() => import('./pages/CartPage'), 'CartPage');
const CheckoutPage = lazyWithRetry(() => import('./pages/CheckoutPage'), 'CheckoutPage');
const OrdersPage = lazyWithRetry(() => import('./pages/OrdersPage'), 'OrdersPage');
const WishlistPage = lazyWithRetry(() => import('./pages/WishlistPage'), 'WishlistPage');
const AccountPage = lazyWithRetry(() => import('./pages/AccountPageV2'), 'AccountPage');
const AccountFeaturePage = lazyWithRetry(() => import('./pages/AccountFeaturePage'), 'AccountFeaturePage');
const AddressesPage = lazyWithRetry(() => import('./pages/AddressesPage'), 'AddressesPage');
const ReturnRequestsPage = lazyWithRetry(() => import('./pages/ReturnRequestsPage'), 'ReturnRequestsPage');
const HelpCenterPage = lazyWithRetry(() => import('./pages/HelpCenterPage'), 'HelpCenterPage');
const CouponsPage = lazyWithRetry(() => import('./pages/CouponsPage'), 'CouponsPage');
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyWithRetry(() => import('./pages/RegisterPage'), 'RegisterPage');
const VerifyEmailPage = lazyWithRetry(() => import('./pages/VerifyEmailPage'), 'VerifyEmailPage');
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage');
const SocialAuthCallbackPage = lazyWithRetry(() => import('./pages/SocialAuthCallbackPage'), 'SocialAuthCallbackPage');
const TrendWithActiveStoriesPage = lazyWithRetry(() => import('./pages/TrendWithActiveStoriesPage'), 'TrendWithActiveStoriesPage');
const TrackingPage = lazyWithRetry(() => import('./pages/TrackingPage'), 'TrackingPage');
const LivePage = lazyWithRetry(() => import('./pages/LivePage'), 'LivePage');
const CustomerSupportPage = lazyWithRetry(() => import('./pages/CustomerSupportPage'), 'CustomerSupportPage');
import './account-care-overrides.css';

const InfoPage=({title,intro,sections})=><div dir="rtl" style={{maxWidth:850,margin:'0 auto',padding:'8px 0 40px'}}><h1>{title}</h1><p style={{color:'#64748B',lineHeight:1.9}}>{intro}</p><div style={{display:'grid',gap:12,marginTop:22}}>{sections.map(([heading,text])=><section key={heading} style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:14,padding:'16px 18px'}}><h2 style={{fontSize:18}}>{heading}</h2><p style={{color:'#475569',lineHeight:1.9}}>{text}</p></section>)}</div></div>;
function AppShell(){const location=useLocation();const isHome=location.pathname==='/';const bannerPlacement=location.pathname==='/'?'home':location.pathname==='/categories'?'categories':location.pathname==='/new-arrivals'?'new-arrivals':location.pathname==='/offers'?'offers':location.pathname==='/trend'?'trend':location.pathname==='/account'||location.pathname.startsWith('/account/')?'account':location.pathname.startsWith('/products/')?'product':location.pathname==='/products'||location.pathname==='/search'?'products':location.pathname==='/sale'?'sale':null;return <><div className={isHome?'':'app-content-with-bottom-nav'}>{bannerPlacement&&<BannerPlacement placement={bannerPlacement}/>}<Suspense fallback={<div dir="rtl" style={{minHeight:'45vh',display:'grid',placeItems:'center',padding:24,color:'#64748b'}}>جارٍ تحميل الصفحة...</div>}><Routes><Route path="/" element={<HomePage/>}/><Route path="products" element={<SearchPage/>}/><Route path="products/:slug" element={<ProductDetailsPage/>}/><Route path="cart" element={<CartPage/>}/><Route path="account" element={<AccountPage/>}/><Route path="account/addresses" element={<AddressesPage/>}/><Route path="account/returns" element={<ReturnRequestsPage/>}/><Route path="account/help" element={<HelpCenterPage/>}/><Route path="account/support/:type" element={<CustomerSupportPage/>}/><Route path="account/:feature" element={<AccountFeaturePage/>}/><Route path="register" element={<RegisterPage/>}/><Route path="categories" element={<CategoriesPage/>}/><Route path="new-arrivals" element={<NewArrivalsPage/>}/><Route path="offers" element={<OffersPage/>}/><Route path="sale" element={<OffersPage/>}/><Route path="checkout" element={<CheckoutPage/>}/><Route path="login" element={<LoginPage/>}/><Route path="forgot-password" element={<ForgotPasswordPage/>}/><Route path="reset-password" element={<ResetPasswordPage/>}/><Route path="auth/social-callback" element={<SocialAuthCallbackPage/>}/><Route path="track" element={<TrackingPage/>}/><Route path="wishlist" element={<WishlistPage/>}/><Route path="trend" element={<TrendWithActiveStoriesPage/>}/><Route path="live/:id" element={<LivePage/>}/><Route path="live" element={<LivePage/>}/><Route path="search" element={<SearchPage/>}/><Route path="orders" element={<OrdersPage/>}/><Route path="coupons" element={<CouponsPage/>}/><Route path="verify-email" element={<VerifyEmailPage/>}/><Route path="about" element={<InfoPage title="من نحن" intro="MYBRAND منصة تسوق متعددة التجار تجمع المنتجات والعروض في تجربة شراء واحدة." sections={[["تجربة التسوق","منتجات متنوعة، سلة، طلب، دفع وتتبع في مسار واحد واضح وسهل الاستخدام."],["التجار","يمكن للتاجر التقدم للانضمام إلى المنصة، وبعد المراجعة يحصل على أدوات لإدارة المنتجات والطلبات والمبيعات."],["خدمة العملاء","يمكن متابعة الطلب من صفحة طلباتي ومعرفة حالته من خلال النظام، مع استخدام قناة التواصل المتاحة عند الحاجة."]]}/>} /><Route path="contact" element={<InfoPage title="تواصل معنا" intro="نحن هنا لمساعدتك في الطلبات والحسابات ومشكلات الشراء." sections={[["مشكلة في طلب","احتفظ برقم الطلب من صفحة طلباتي واستخدم صفحة التتبع لمعرفة آخر حالة مسجلة."],["مشكلة في الدفع","راجع طريقة الدفع وحالة العملية في تفاصيل الطلب، ولا تعِد الدفع قبل التأكد من حالة العملية."],["التجار","طلبات الانضمام للتجار تخضع للمراجعة، ويمكن متابعة حالة الحساب من خلال لوحة التاجر بعد تسجيل الدخول."]]}/>} /><Route path="privacy" element={<InfoPage title="سياسة الخصوصية" intro="توضح هذه الصفحة المبادئ الأساسية للتعامل مع بيانات مستخدمي MYBRAND." sections={[["البيانات المستخدمة","بيانات الحساب والاتصال وعنوان التوصيل وبيانات الطلب اللازمة لتنفيذ الشراء والشحن وخدمة العملاء."],["الغرض من الاستخدام","تُستخدم البيانات لتسجيل الحساب، تنفيذ الطلبات، الشحن، خدمة العملاء، حماية المنصة وتحسين الخدمة."]]}/>} /><Route path="terms" element={<InfoPage title="الشروط والأحكام" intro="باستخدام MYBRAND، يوافق المستخدم على الالتزام بقواعد الشراء واستخدام الحساب والمنصة." sections={[["الحساب","يجب تقديم بيانات صحيحة والمحافظة على سرية بيانات الدخول."],["الطلبات والأسعار","قد تتغير الأسعار والمخزون والعروض وتظهر حالة الطلب من خلال النظام."],["الدفع والشحن","تظهر الرسوم قبل تأكيد الطلب."],["التجار والمنتجات","التجار مسؤولون عن بيانات منتجاتهم والتزامهم بسياسات المنصة."]]}/>} /></Routes></Suspense></div><BottomNav/></>}
export default function App(){return <AuthProvider><CartProvider><WishlistProvider><BrowserRouter><StoreLayoutProvider><StorefrontErrorBoundary><StorefrontMaintenanceGate><AppShell/></StorefrontMaintenanceGate></StorefrontErrorBoundary></StoreLayoutProvider></BrowserRouter></WishlistProvider></CartProvider></AuthProvider>}
