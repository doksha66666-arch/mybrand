import React from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import BottomNav from './components/BottomNav';
import LoyaltyCheckoutBar from './components/LoyaltyCheckoutBar';
import BannerPlacement from './components/BannerPlacement';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import OffersPage from './pages/OffersPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPageV2';
import AccountFeaturePage from './pages/AccountFeaturePage';
import AddressesPage from './pages/AddressesPage';
import ReturnRequestsPage from './pages/ReturnRequestsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import CouponsPage from './pages/CouponsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SocialAuthCallbackPage from './pages/SocialAuthCallbackPage';
import TrendWithActiveStoriesPage from './pages/TrendWithActiveStoriesPage';
import TrackingPage from './pages/TrackingPage';
import LivePage from './pages/LivePage';
import CustomerSupportPage from './pages/CustomerSupportPage';
import './account-care-overrides.css';

const InfoPage=({title,intro,sections})=><div dir="rtl" style={{maxWidth:850,margin:'0 auto',padding:'8px 0 40px'}}><h1>{title}</h1><p style={{color:'#64748B',lineHeight:1.9}}>{intro}</p><div style={{display:'grid',gap:12,marginTop:22}}>{sections.map(([heading,text])=><section key={heading} style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:14,padding:'16px 18px'}}><h2 style={{fontSize:18}}>{heading}</h2><p style={{color:'#475569',lineHeight:1.9}}>{text}</p></section>)}</div></div>;
function AppShell(){const location=useLocation();const isHome=location.pathname==='/';const bannerPlacement=location.pathname==='/'?'home':location.pathname==='/categories'?'categories':location.pathname==='/new-arrivals'?'new-arrivals':location.pathname==='/offers'?'offers':location.pathname==='/trend'?'trend':location.pathname==='/account'||location.pathname.startsWith('/account/')?'account':location.pathname.startsWith('/products/')?'product':location.pathname==='/products'||location.pathname==='/search'?'products':location.pathname==='/sale'?'sale':null;return <>{location.pathname==='/checkout'&&<LoyaltyCheckoutBar/>}<div className={isHome?'':'app-content-with-bottom-nav'}>{bannerPlacement&&<BannerPlacement placement={bannerPlacement}/>}<Routes><Route path="/" element={<HomePage/>}/><Route path="products/:slug" element={<ProductDetailsPage/>}/><Route path="cart" element={<CartPage/>}/><Route path="account" element={<AccountPage/>}/><Route path="account/addresses" element={<AddressesPage/>}/><Route path="account/returns" element={<ReturnRequestsPage/>}/><Route path="account/help" element={<HelpCenterPage/>}/><Route path="account/support/:type" element={<CustomerSupportPage/>}/><Route path="account/:feature" element={<AccountFeaturePage/>}/><Route path="register" element={<RegisterPage/>}/><Route path="categories" element={<CategoriesPage/>}/><Route path="new-arrivals" element={<NewArrivalsPage/>}/><Route path="offers" element={<OffersPage/>}/><Route path="checkout" element={<CheckoutPage/>}/><Route path="login" element={<LoginPage/>}/><Route path="forgot-password" element={<ForgotPasswordPage/>}/><Route path="reset-password" element={<ResetPasswordPage/>}/><Route path="auth/social-callback" element={<SocialAuthCallbackPage/>}/><Route path="track" element={<TrackingPage/>}/><Route path="wishlist" element={<WishlistPage/>}/><Route path="trend" element={<TrendWithActiveStoriesPage/>}/><Route path="live/:id" element={<LivePage/>}/><Route path="live" element={<LivePage/>}/><Route path="search" element={<Navigate to="/" replace/>}/><Route path="orders" element={<OrdersPage/>}/><Route path="coupons" element={<CouponsPage/>}/><Route path="verify-email" element={<VerifyEmailPage/>}/><Route path="about" element={<InfoPage title="من نحن" intro="MYBRAND منصة تسوق متعددة التجار تجمع المنتجات والعروض في تجربة شراء واحدة." sections={[["تجربة التسوق","منتجات متنوعة، سلة، طلب، دفع وتتبع في مسار واحد واضح وسهل الاستخدام."],["التجار","يمكن للتاجر التقدم للانضمام إلى المنصة، وبعد المراجعة يحصل على أدوات لإدارة المنتجات والطلبات والمبيعات."],["خدمة العملاء","يمكن متابعة الطلب من صفحة طلباتي ومعرفة حالته من خلال النظام، مع استخدام قناة التواصل المتاحة عند الحاجة."]]}/>} /><Route path="contact" element={<InfoPage title="تواصل معنا" intro="نحن هنا لمساعدتك في الطلبات والحسابات ومشكلات الشراء." sections={[["مشكلة في طلب","احتفظ برقم الطلب من صفحة طلباتي واستخدم صفحة التتبع لمعرفة آخر حالة مسجلة."],["مشكلة في الدفع","راجع طريقة الدفع وحالة العملية في تفاصيل الطلب، ولا تعِد الدفع قبل التأكد من حالة العملية."],["التجار","طلبات الانضمام للتجار تخضع للمراجعة، ويمكن متابعة حالة الحساب من خلال لوحة التاجر بعد تسجيل الدخول."]]}/>} /><Route path="privacy" element={<InfoPage title="سياسة الخصوصية" intro="توضح هذه الصفحة المبادئ الأساسية للتعامل مع بيانات مستخدمي MYBRAND." sections={[["البيانات المستخدمة","بيانات الحساب والاتصال وعنوان التوصيل وبيانات الطلب اللازمة لتنفيذ الشراء والشحن وخدمة العملاء."],["الغرض من الاستخدام","تُستخدم البيانات لتسجيل الحساب، تنفيذ الطلبات، الشحن، خدمة العملاء، حماية المنصة وتحسين الخدمة."]]}/>} /><Route path="terms" element={<InfoPage title="الشروط والأحكام" intro="باستخدام MYBRAND، يوافق المستخدم على الالتزام بقواعد الشراء واستخدام الحساب والمنصة." sections={[["الحساب","يجب تقديم بيانات صحيحة والمحافظة على سرية بيانات الدخول."],["الطلبات والأسعار","قد تتغير الأسعار والمخزون والعروض وتظهر حالة الطلب من خلال النظام."],["الدفع والشحن","تظهر الرسوم قبل تأكيد الطلب."],["التجار والمنتجات","التجار مسؤولون عن بيانات منتجاتهم والتزامهم بسياسات المنصة."]]}/>} /></Routes></div><BottomNav/></>}
export default function App(){return <AuthProvider><CartProvider><WishlistProvider><BrowserRouter><AppShell/></BrowserRouter></WishlistProvider></CartProvider></AuthProvider>}
