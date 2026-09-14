import React from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminErrorBoundary from './components/AdminErrorBoundary';
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

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <AdminErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="studio" element={<StudioPage />} />
              <Route path="trend" element={<TrendHubPage />} />
              <Route path="merchants" element={<MerchantsPage />} />
              <Route path="merchants/:id" element={<MerchantDetailPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="models" element={<ModelsPage />} />
              <Route path="payment-methods" element={<PaymentMethodsPage />} />
              <Route path="loyalty" element={<LoyaltyPage />} />
              <Route path="gift-cards" element={<GiftCardsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/add" element={<AddProductPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="offers" element={<OffersPage />} />
              <Route path="coupons" element={<CouponsPage />} />
              <Route path="store-customizer" element={<StoreCustomizerPage />} />
              <Route path="customer-service" element={<CustomerServicePage />} />
              <Route path="support-tickets" element={<SupportTicketsPage />} />
              <Route path="live" element={<LiveOBSPage />} />
            </Route>
          </Routes>
        </AdminErrorBoundary>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
