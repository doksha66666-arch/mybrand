import React from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { MerchantAuthProvider } from './context/MerchantAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import MerchantProductsPageV2 from './pages/MerchantProductsPageV2';
import MerchantFulfillmentCenterPage from './pages/MerchantFulfillmentCenterPage';
import SalesPage from './pages/SalesPage';
import CommissionPage from './pages/CommissionPage';
import ProfilePage from './pages/ProfilePage';
import StoreCustomizerPage from './pages/StoreCustomizerPage';
import StudioPage from './pages/StudioPage';
import MerchantTrendStudio from './pages/MerchantTrendStudio';
import MerchantLiveStudioPage from './pages/MerchantLiveStudioPage';

export default function App() {
  return (
    <MerchantAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/merchant-login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="studio/live" element={<MerchantLiveStudioPage />} />
            <Route path="studio/trend" element={<MerchantTrendStudio />} />
            <Route path="products" element={<MerchantProductsPageV2 />} />
            <Route path="orders" element={<MerchantFulfillmentCenterPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="commission" element={<CommissionPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </MerchantAuthProvider>
  );
}
