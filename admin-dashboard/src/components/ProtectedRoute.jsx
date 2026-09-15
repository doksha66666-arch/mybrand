import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canAccess } from '../utils/permissions';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAdminAuth();
  const location = useLocation();

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

  if (!canAccess(user, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
