import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAdminAuth();

  if (loading) return <div style={{ padding: 40 }}>...جارٍ التحميل</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
