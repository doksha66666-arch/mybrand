import React from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { MerchantAuthProvider } from './context/MerchantAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnifiedLoginPage from './UnifiedLoginPage';
import AdminEmbeddedApp from './AdminEmbeddedApp';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import MerchantFulfillmentCenterPage from './pages/MerchantFulfillmentCenterPage';
import SalesPage from './pages/SalesPage';
import CommissionPage from './pages/CommissionPage';
import ProfilePage from './pages/ProfilePage';
import StudioPage from './pages/StudioPage';
import MerchantTrendStudio from './pages/MerchantTrendStudio';

export default function App() {
  return (
    <MerchantAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<UnifiedLoginPage />} />
          <Route path="/merchant-login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/*" element={<AdminEmbeddedApp />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="studio/trend" element={<MerchantTrendStudio />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<MerchantFulfillmentCenterPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="commission" element={<CommissionPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="stories" element={<Navigate to="/studio/trend" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </MerchantAuthProvider>
  );
}
