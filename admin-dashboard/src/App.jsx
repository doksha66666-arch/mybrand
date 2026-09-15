import React from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminErrorBoundary from './components/AdminErrorBoundary';
import { canAccess } from './utils/permissions';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import AddProductPage from './pages/AddProductPage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import MerchantsPage from './pages/MerchantsPage';
import MerchantDetailPage from './pages/MerchantDetailPage';
import BannersPage from './pages/BannersPage';
import CampaignsPage from './pages/CampaignsPage';
import OffersPage from './pages/OffersPage';
import CouponsPage from './pages/CouponsPage';
import GiftCardsPage from './pages/GiftCardsPage';
import StoreCustomizerPage from './pages/StoreCustomizerPage';
import CustomerServicePage from './pages/CustomerServicePage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import LiveOBSPage from './pages/LiveOBSPage';
import StudioPage from './pages/StudioPage';
import TrendHubPage from './pages/TrendHubPage';
import StaffPage from './pages/StaffPage';
import ModelsPage from './pages/ModelsPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import LoyaltyPage from './pages/LoyaltyPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function PermissionRoute({ path, action = 'view', children }) {
  const { user } = useAdminAuth();
  if (!canAccess(user, path, action)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <AdminErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<PermissionRoute path="/"><DashboardPage /></PermissionRoute>} />
              <Route path="studio" element={<PermissionRoute path="/studio"><StudioPage /></PermissionRoute>} />
              <Route path="trend" element={<PermissionRoute path="/trend"><TrendHubPage /></PermissionRoute>} />
              <Route path="merchants" element={<PermissionRoute path="/merchants"><MerchantsPage /></PermissionRoute>} />
              <Route path="merchants/:id" element={<PermissionRoute path="/merchants"><MerchantDetailPage /></PermissionRoute>} />
              <Route path="staff" element={<PermissionRoute path="/staff"><StaffPage /></PermissionRoute>} />
              <Route path="models" element={<PermissionRoute path="/models"><ModelsPage /></PermissionRoute>} />
              <Route path="payment-methods" element={<PermissionRoute path="/payment-methods"><PaymentMethodsPage /></PermissionRoute>} />
              <Route path="loyalty" element={<PermissionRoute path="/loyalty"><LoyaltyPage /></PermissionRoute>} />
              <Route path="gift-cards" element={<PermissionRoute path="/gift-cards"><GiftCardsPage /></PermissionRoute>} />
              <Route path="reports" element={<PermissionRoute path="/reports"><ReportsPage /></PermissionRoute>} />
              <Route path="settings" element={<PermissionRoute path="/settings" action="edit"><SettingsPage /></PermissionRoute>} />
              <Route path="products" element={<PermissionRoute path="/products"><ProductsPage /></PermissionRoute>} />
              <Route path="products/add" element={<PermissionRoute path="/products/add"><AddProductPage /></PermissionRoute>} />
              <Route path="products/edit/:id" element={<PermissionRoute path="/products/edit/:id"><AddProductPage /></PermissionRoute>} />
              <Route path="categories" element={<PermissionRoute path="/categories"><CategoriesPage /></PermissionRoute>} />
              <Route path="orders" element={<PermissionRoute path="/orders"><OrdersPage /></PermissionRoute>} />
              <Route path="customers" element={<PermissionRoute path="/customers"><CustomersPage /></PermissionRoute>} />
              <Route path="banners" element={<PermissionRoute path="/banners"><BannersPage /></PermissionRoute>} />
              <Route path="campaigns" element={<PermissionRoute path="/campaigns"><CampaignsPage /></PermissionRoute>} />
              <Route path="offers" element={<PermissionRoute path="/offers"><OffersPage /></PermissionRoute>} />
              <Route path="coupons" element={<PermissionRoute path="/coupons"><CouponsPage /></PermissionRoute>} />
              <Route path="store-customizer" element={<PermissionRoute path="/store-customizer" action="edit"><StoreCustomizerPage /></PermissionRoute>} />
              <Route path="customer-service" element={<PermissionRoute path="/customer-service"><CustomerServicePage /></PermissionRoute>} />
              <Route path="support-tickets" element={<PermissionRoute path="/support-tickets"><SupportTicketsPage /></PermissionRoute>} />
              <Route path="live" element={<PermissionRoute path="/live"><LiveOBSPage /></PermissionRoute>} />
            </Route>
          </Routes>
        </AdminErrorBoundary>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
