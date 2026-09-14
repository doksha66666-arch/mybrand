import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useMerchantAuth();

  if (loading) return <div style={{ padding: 40 }}>...جارٍ التحميل</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
