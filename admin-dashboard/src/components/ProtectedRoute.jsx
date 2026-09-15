import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-loading-screen" dir="rtl">
        <div className="admin-loading-card">
          <span className="admin-loading-mark">M</span>
          <strong>MYBRAND</strong>
          <span>جارٍ تجهيز مركز الإدارة...</span>
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'staff'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
