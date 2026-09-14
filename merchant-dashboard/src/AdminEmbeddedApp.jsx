import React, { lazy, Suspense, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../../admin-dashboard/src/context/AdminAuthContext';
import AdminProtectedRoute from '../../admin-dashboard/src/components/ProtectedRoute';
import AdminErrorBoundary from '../../admin-dashboard/src/components/AdminErrorBoundary';
import AdminEmbeddedLayout from './AdminEmbeddedLayout';
import '../../admin-dashboard/src/index.css';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || 'https://mybrand-app-production-e260.up.railway.app/api').replace(/\/$/, '');

const AdminDashboardPage = lazy(() => import('../../admin-dashboard/src/pages/DashboardPage'));
const AdminProductsPage = lazy(() => import('../../admin-dashboard/src/pages/ProductsPage'));
const AdminAddProductPage = lazy(() => import('../../admin-dashboard/src/pages/AddProductPage'));
const AdminCategoriesPage = lazy(() => import('../../admin-dashboard/src/pages/CategoriesPage'));
const AdminOrdersPage = lazy(() => import('../../admin-dashboard/src/pages/OrdersPage'));
const AdminCustomersPage = lazy(() => import('../../admin-dashboard/src/pages/CustomersPage'));
const AdminMerchantsPage = lazy(() => import('../../admin-dashboard/src/pages/MerchantsPage'));
const AdminMerchantDetailPage = lazy(() => import('../../admin-dashboard/src/pages/MerchantDetailPage'));
const AdminProductReviewPage = lazy(() => import('../../admin-dashboard/src/pages/ProductReviewPage'));
const AdminBannersPage = lazy(() => import('../../admin-dashboard/src/pages/BannersPage'));
const AdminCampaignsPage = lazy(() => import('../../admin-dashboard/src/pages/CampaignsPage'));
const AdminOffersPage = lazy(() => import('../../admin-dashboard/src/pages/OffersPage'));
const AdminCouponsPage = lazy(() => import('../../admin-dashboard/src/pages/CouponsPage'));
const AdminGiftCardsPage = lazy(() => import('../../admin-dashboard/src/pages/GiftCardsPage'));
const AdminStoreCustomizerPage = lazy(() => import('../../admin-dashboard/src/pages/StoreCustomizerPage'));
const AdminCustomerServicePage = lazy(() => import('../../admin-dashboard/src/pages/CustomerServicePage'));
const AdminSupportTicketsPage = lazy(() => import('../../admin-dashboard/src/pages/SupportTicketsPage'));
const AdminLiveOBSPage = lazy(() => import('../../admin-dashboard/src/pages/LiveOBSPage'));
const AdminStudioPage = lazy(() => import('../../admin-dashboard/src/pages/StudioPage'));
const AdminTrendHubPage = lazy(() => import('../../admin-dashboard/src/pages/TrendHubPage'));
const AdminStaffPage = lazy(() => import('../../admin-dashboard/src/pages/StaffPage'));
const AdminModelsPage = lazy(() => import('../../admin-dashboard/src/pages/ModelsPage'));
const AdminPaymentMethodsPage = lazy(() => import('../../admin-dashboard/src/pages/PaymentMethodsPage'));
const AdminLoyaltyPage = lazy(() => import('../../admin-dashboard/src/pages/LoyaltyPage'));
const AdminReportsPage = lazy(() => import('../../admin-dashboard/src/pages/ReportsPage'));
const AdminSettingsPage = lazy(() => import('../../admin-dashboard/src/pages/SettingsPage'));

const Loading = () => (
  <div dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f8fb', color: '#101828', fontFamily: 'Arial, sans-serif' }}>
    جارٍ تحميل لوحة التحكم...
  </div>
);

function InlineAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'تعذر تسجيل الدخول');
      if (data?.user?.role !== 'admin') throw new Error('هذا الحساب لا يملك صلاحيات المشرف');
      localStorage.setItem('mybrand_admin_token', data.token);
      navigate('/admin', { replace: true });
      window.location.reload();
    } catch (err) {
      setError(err?.message || 'تعذر تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#F8FAFC', fontFamily: 'Tajawal, Arial, sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ width: 'min(380px, 100%)', background: '#fff', padding: 32, borderRadius: 18, boxShadow: '0 12px 40px rgba(15,23,42,.10)', border: '1px solid #E2E8F0' }}>
        <h1 style={{ margin: '0 0 8px', textAlign: 'center', color: '#0F172A', fontSize: 23 }}>MYBRAND</h1>
        <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>تسجيل دخول الأدمن</p>
        {error && <div style={{ marginBottom: 14, padding: 11, borderRadius: 9, background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>{error}</div>}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="البريد الإلكتروني" autoComplete="username" required style={{ width: '100%', padding: 13, marginBottom: 12, borderRadius: 9, border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="كلمة المرور" autoComplete="current-password" required style={{ width: '100%', padding: 13, marginBottom: 16, borderRadius: 9, border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
        <button type="submit" disabled={submitting} style={{ width: '100%', padding: 13, border: 0, borderRadius: 9, background: '#0F172A', color: '#fff', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'جارٍ الدخول...' : 'دخول الأدمن'}</button>
      </form>
    </div>
  );
}

function AdminDashboardRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/admin/*" element={<AdminProtectedRoute><AdminEmbeddedLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="studio" element={<AdminStudioPage />} />
          <Route path="trend" element={<AdminTrendHubPage />} />
          <Route path="merchants" element={<AdminMerchantsPage />} />
          <Route path="merchants/:id" element={<AdminMerchantDetailPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="models" element={<AdminModelsPage />} />
          <Route path="payment-methods" element={<AdminPaymentMethodsPage />} />
          <Route path="payments" element={<AdminPaymentMethodsPage />} />
          <Route path="loyalty" element={<AdminLoyaltyPage />} />
          <Route path="gift-cards" element={<AdminGiftCardsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="products-review" element={<AdminProductReviewPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/add" element={<AdminAddProductPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="campaigns" element={<AdminCampaignsPage />} />
          <Route path="offers" element={<AdminOffersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="store-customizer" element={<AdminStoreCustomizerPage />} />
          <Route path="customer-service" element={<AdminCustomerServicePage />} />
          <Route path="support-tickets" element={<AdminSupportTicketsPage />} />
          <Route path="live" element={<AdminLiveOBSPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function AuthenticatedAdmin() {
  const { user, loading } = useAdminAuth();
  if (loading) return <Loading />;
  if (!user) return <InlineAdminLogin />;
  return <AdminDashboardRouter />;
}

export default function AdminEmbeddedApp() {
  const hasToken = Boolean(localStorage.getItem('mybrand_admin_token'));
  if (!hasToken) return <InlineAdminLogin />;

  return (
    <AdminAuthProvider>
      <AdminErrorBoundary>
        <AuthenticatedAdmin />
      </AdminErrorBoundary>
    </AdminAuthProvider>
  );
}
